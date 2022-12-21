/* eslint-disable max-len */
/* eslint-disable no-bitwise */
import {
  Client,
  cryptoUtils,
  utils,
  Types,
  Transaction,
  Operation,
  TransactionConfirmation,
  PrivateKey,
  DynamicGlobalProperties,
  Asset,
  Account,
} from '@upvu/dsteem';
import ByteBuffer from 'bytebuffer';
import {createHash} from 'react-native-crypto';
import {Manabar} from '@upvu/dsteem/lib/chain/rc';

// import {Client as hsClient} from 'hivesigner';
import Config from 'react-native-config';
import {getServer, getCache, setCache} from '../../realm/realm';

// Utils
import {decryptKey} from '../../utils/crypto';
import {parsePosts, parsePost, parseComments, parseCommentThreads} from '../../utils/postParser';
import {getName, getAvatar, parseReputation} from '../../utils/user';
import parseToken from '../../utils/parseToken';
import parseAsset from '../../utils/parseAsset';
import filterNsfwPost from '../../utils/filterNsfwPost';
import {jsonStringify} from '../../utils/jsonUtils';
import {getDsteemDateErrorMessage} from '../../utils/dsteemUtils';

// Constant
// import AUTH_TYPE from '../../constants/authType';
import {SERVER_LIST} from '../../constants/options/api';
import {b64uEnc} from '../../utils/b64';
import bugsnagInstance from '../../config/bugsnag';
import {makeJsonMetadataReply} from '../../utils/editor';

global.Buffer = global.Buffer || require('buffer').Buffer;

const DEFAULT_SERVER = SERVER_LIST;
let client = new Client(DEFAULT_SERVER, {
  timeout: 4000,
  failoverThreshold: 10,
  consoleOnFailover: true,
});

export const checkClient = async () => {
  const selectedServer = DEFAULT_SERVER;

  await getServer().then(response => {
    if (response) {
      selectedServer.unshift(response);
    }
  });

  client = new Client(selectedServer, {
    timeout: 4000,
    failoverThreshold: 10,
    consoleOnFailover: true,
  });
};

checkClient();

const sha256 = (input: Buffer | string): Buffer => {
  return createHash('sha256').update(input).digest();
};

export const generateTrxId = (transaction: Record<string, any>) => {
  const buffer = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
  try {
    // @ts-expect-error
    Types.Transaction(buffer, transaction);
  } catch (cause) {
    console.warn('SerializationError', cause);
  }
  buffer.flip();
  const transactionData = Buffer.from(buffer.toBuffer());
  return sha256(transactionData).toString('hex').slice(0, 40); // CryptoJS.enc.Hex
};

export const sendHiveOperations = async (
  operations: Operation[],
  key: PrivateKey | PrivateKey[],
): Promise<TransactionConfirmation> => {
  const {head_block_number, head_block_id, time} = await getDynamicGlobalProperties();
  const ref_block_num = head_block_number & 0xffff;
  const ref_block_prefix = Buffer.from(head_block_id, 'hex').readUInt32LE(4);
  const expireTime = 60 * 1000;
  const chainId = Buffer.from(
    '0000000000000000000000000000000000000000000000000000000000000000',
    'hex',
  );
  const expiration = new Date(new Date(`${time}Z`).getTime() + expireTime)
    .toISOString()
    .slice(0, -5);
  const extensions: any[] = [];

  const tx: Transaction = {
    expiration,
    extensions,
    operations,
    ref_block_num,
    ref_block_prefix,
  };

  const transaction = await cryptoUtils.signTransaction(tx, key, chainId);
  const trxId = generateTrxId(transaction);
  const resultHive = await client.broadcast.call('broadcast_transaction', [transaction]);
  const result = {id: trxId, ...resultHive};
  return result;
};

export const getDigitPinCode = (pin: string) => decryptKey(pin, Config.PIN_KEY);

export const getDynamicGlobalProperties = () => client.database.getDynamicGlobalProperties();

export const getRewardFund = () => client.database.call('get_reward_fund', ['post']);

export const getFeedHistory = async () => {
  try {
    const feedHistory = await client.database.call('get_feed_history');
    return feedHistory;
  } catch (error) {
    return error;
  }
};

export const getCurrentMedianHistoryPrice = async () => {
  try {
    const feedHistory = await client.database.call('get_current_median_history_price');
    return feedHistory;
  } catch (error) {
    return error;
  }
};

export const fetchGlobalProps = async () => {
  let globalDynamic;
  let medianHistory;
  let rewardFund;

  try {
    globalDynamic = await getDynamicGlobalProperties();
    await setCache('globalDynamic', globalDynamic);
    medianHistory = await getFeedHistory();
    rewardFund = await getRewardFund();
  } catch (e) {
    return;
  }

  const hivePerMVests =
    (parseToken(globalDynamic.total_vesting_fund_steem.toString()) /
      parseToken(globalDynamic.total_vesting_shares.toString())) *
    1e6;
  const hbdPrintRate = globalDynamic.sbd_print_rate;
  const base = parseAsset(medianHistory.current_median_history.base).amount;
  const quote = parseAsset(medianHistory.current_median_history.quote).amount;
  const fundRecentClaims = rewardFund.recent_claims;
  const fundRewardBalance = parseToken(rewardFund.reward_balance);
  const globalProps = {
    hivePerMVests,
    base,
    quote,
    fundRecentClaims,
    fundRewardBalance,
    hbdPrintRate,
  };

  return globalProps;
};

/**
 * fetches all trading orders that are not full-filled yet
 * @param {string} username
 * @returns {Promise<OpenOrderItem[]>} array of open orders both hive and hbd
 */
export const getOpenOrders = async (username: string) => {
  try {
    const rawData = await client.call('condenser_api', 'get_open_orders', [username]);
    if (!rawData || !rawData.length) {
      return [];
    }
    return rawData;
  } catch (err) {
    console.warn('Failed to get open orders', err);
    return [];
  }
};

/**
 * fetches all pending conversion requests that are yet to be fulfilled
 * @param {string} account
 * @returns {Promise<ConversionRequest[]>}  array of conversion requests
 */
export const getConversionRequests = async (username: string) => {
  try {
    const rawData = await client.database.call('get_conversion_requests', [username]);
    if (!rawData || !rawData.length) {
      return [];
    }
    return rawData;
  } catch (err) {
    console.warn('Failed to get open orders', err);
    return [];
  }
};

/**
 * fetches all pending conversion requests that are yet to be fulfilled
 * @param {string} account
 * @returns {Promise<SavingsWithdrawRequest[]>}  array of requested savings withdraw
 */

export const getSavingsWithdrawFrom = async (username: string) => {
  try {
    const rawData = await client.database.call('get_savings_withdraw_from', [username]);
    if (!rawData || !rawData.length) {
      return [];
    }
    return rawData;
  } catch (err) {
    console.warn('Failed to get open orders', err);
    return [];
  }
};

/**
 * @method getAccount fetch raw account data without post processing
 * @param username username
 */
export const getAccount = (username: string) =>
  client.database.getAccounts([username]).then(response => {
    if (response.length) {
      return response[0];
    }
    return Promise.reject(new Error(`Account not found, ${JSON.stringify(response)}`));
  });

export const getAccountHistory = async (
  user: any,
  operations: any,
  startIndex = -1,
  limit = 1000,
) => {
  const wallet_operations_bitmask = utils.makeBitMaskFilter(operations);
  const ah = await client.call('condenser_api', 'get_account_history', [
    user,
    startIndex,
    limit,
    ...wallet_operations_bitmask,
  ]);
  return ah as any[];
};

/**
 * @method getAccount get account data
 * @param user username
 */
export const getState = async (path: string) => client.database.getState(path);

/**
 * @method getUser get account data
 * @param username username
 */
export const getUser = async (username: any) => {
  const accounts = await client.database.getAccounts([username]);
  if (accounts && accounts.length < 1) {
    return null;
  }

  const unreadActivityCount = 0;
  const results = {
    ...accounts[0],
    username: '',
    unread_activity_count: unreadActivityCount,
    vp_manabar: {current_mana: 0, max_mana: 0, percentage: 0} as Manabar,
    rc_manabar: {current_mana: 0, max_mana: 0, percentage: 0} as Manabar,
    steem_power: '0',
    received_steem_power: '0',
    delegated_steem_power: '0',
    about: {} as any,
    avatar: '',
    display_name: '',
  };

  let globalProperties: DynamicGlobalProperties;
  try {
    globalProperties = await getDynamicGlobalProperties();
  } catch (error) {
    globalProperties = (await getCache('globalDynamic')) as DynamicGlobalProperties;
  }

  const rcPower =
    (await client.call('rc_api', 'find_rc_accounts', {accounts: [username]})) ||
    (await getCache('rcPower'));
  await setCache('rcPower', rcPower);

  results.reputation = parseReputation(results.reputation);
  results.username = results.name;
  results.unread_activity_count = unreadActivityCount;
  results.vp_manabar = client.rc.calculateVPMana(results);
  results.rc_manabar = client.rc.calculateRCMana(rcPower.rc_accounts[0]);
  results.steem_power = vestToSteem(
    results.vesting_shares,
    globalProperties.total_vesting_shares,
    globalProperties.total_vesting_fund_steem,
  );
  results.received_steem_power = vestToSteem(
    results?.received_vesting_shares,
    globalProperties?.total_vesting_shares,
    globalProperties?.total_vesting_fund_steem,
  );
  results.delegated_steem_power = vestToSteem(
    results?.delegated_vesting_shares,
    globalProperties?.total_vesting_shares,
    globalProperties?.total_vesting_fund_steem,
  );

  if ('posting_json_metadata' in results) {
    try {
      results.about = JSON.parse(results?.posting_json_metadata);
    } catch (e) {
      results.about = {};
    }
    results.avatar = getAvatar(results?.about);
    results.display_name = getName(results?.about);
  }

  return results;
};

const cache: Record<string, any> = {};
const pattern = /hive-\d\w+/g;
export const getCommunity = async (tag: string, observer = '') => {
  const community = client.call('bridge', 'get_community', {
    name: tag,
    observer,
  });
  return community ?? {};
};

export const getCommunityTitle = async (tag: string) => {
  if (cache[tag] !== undefined) {
    return cache[tag];
  }
  const mm = tag.match(pattern);
  if (mm && mm.length > 0) {
    const community = await client.call('bridge', 'get_community', {
      name: tag,
      observer: '',
    });
    if (community) {
      const {title} = community;
      cache[tag] = title;
      return title;
    } else {
      return tag;
    }
  }

  return tag;
};

export const getCommunities = async (
  last = '',
  limit = 100,
  query = null,
  sort = 'rank',
  observer = '',
) => {
  try {
    console.log('Getting communities', query);
    const data = await client.call('bridge', 'list_communities', {
      last,
      limit,
      query,
      sort,
      observer,
    });
    return data ?? {};
  } catch (error) {
    return {};
  }
};

export const getSubscriptions = async (account = '') => {
  const data = await client.call('bridge', 'list_all_subscriptions', {
    account,
  });
  return data ?? {};
};

// TODO: Move to utils folder
export const vestToSteem = (
  vestingShares: string | Asset,
  totalVestingShares: string | Asset,
  totalVestingFundSteem: string | Asset,
) => {
  return (
    parseFloat(totalVestingFundSteem.toString()) *
    (parseFloat(vestingShares.toString()) / parseFloat(totalVestingShares.toString()))
  ).toFixed(0);
};

export const getFollows = (username: string) => {
  return client.database.call('get_follow_count', [username]);
};

export const getFollowing = (
  follower: string,
  startFollowing: string,
  followType = 'blog',
  limit = 100,
) => {
  return client.database.call('get_following', [follower, startFollowing, followType, limit]);
};

export const getFollowers = (
  follower: string,
  startFollowing: string,
  followType = 'blog',
  limit = 100,
) => {
  return client.database.call('get_followers', [follower, startFollowing, followType, limit]);
};

export const getMutes = async (username: string) => {
  try {
    const type = 'ignore';
    const limit = 1000;
    const response: any[] = await client.database.call('get_following', [
      username,
      '',
      type,
      limit,
    ]);
    if (!response) {
      return [];
    }
    return response.map(item => item.following);
  } catch (err: any) {
    console.warn('Failed to get muted accounts', err);
    bugsnagInstance.notify(err);
    return [];
  }
};

export const getRelationship = async (follower: string, following: string) => {
  if (!follower) {
    return false;
  }
  const result = await client.call('bridge', 'get_relationship_between_accounts', [
    follower,
    following,
  ]);
  return result ?? false;
};

export const getFollowSearch = async (user: string, targetUser: string) => {
  if (!targetUser) {
    return null;
  }
  return client.database.call('get_following', [targetUser, user, 'blog', 1]).then(result => {
    if (result[0] && result[0].follower === targetUser && result[0].following === user) {
      return result;
    } else {
      return null;
    }
  });
};

export const ignoreUser = async (currentAccount: any, pin: string, data: any) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    return api.ignore(data.follower, data.following);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);

    const json = {
      id: 'follow',
      json: jsonStringify([
        'follow',
        {
          follower: `${data.follower}`,
          following: `${data.following}`,
          what: ['ignore'],
        },
      ]),
      required_auths: [],
      required_posting_auths: [`${data.follower}`],
    };
    const opArray: Operation[] = [['custom_json', json]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private posting key or above.');
};

export const getActiveVotes = (author: string, permlink: string) =>
  client.call('condenser_api', 'get_active_votes', [author, permlink]);

export const getRankedPosts = async (
  query: {sort: 'comments' | 'replies'},
  currentUserName: string,
  filterNsfw: '0' | '1' | '2',
) => {
  try {
    console.log('Getting ranked posts:', query);

    let posts = await client.call('bridge', 'get_ranked_posts', query);

    if (posts) {
      const areComments = query.sort === 'comments' || query.sort === 'replies';
      posts = areComments ? parseComments(posts) : parsePosts(posts, currentUserName);

      if (filterNsfw !== '0') {
        const updatedPosts = filterNsfwPost(posts, filterNsfw);
        return updatedPosts;
      }
    }
    console.log(`Returning fetched posts: ${posts}` ? posts.length : null);
    return posts;
  } catch (error) {
    return error;
  }
};

export const getAccountPosts = async (
  query: {sort: 'comments' | 'replies'},
  currentUserName?: any,
  filterNsfw?: '0' | '1' | '2',
) => {
  try {
    console.log('Getting account posts: ', query);
    let posts = await client.call('bridge', 'get_account_posts', query);

    if (posts) {
      const areComments = query.sort === 'comments' || query.sort === 'replies';
      posts = areComments ? parseComments(posts) : parsePosts(posts, currentUserName);

      if (filterNsfw !== '0') {
        const updatedPosts = filterNsfwPost(posts, filterNsfw);
        return updatedPosts;
      }
    }
    console.log(`Returning fetched posts: ${posts}` ? posts.length : null);
    return posts;
  } catch (error) {
    return error;
  }
};

export const getRepliesByLastUpdate = async (query: {
  start_author: string;
  start_permlink: string;
  limit: number;
}) => {
  try {
    console.log('Getting replies: ', query);
    const replies = await client.database.call('get_replies_by_last_update', [
      query.start_author,
      query.start_permlink,
      query.limit,
    ]);
    const groomedComments = parseComments(replies);
    return groomedComments;
  } catch (error) {
    return error;
  }
};

export const getPost = async (
  author: string,
  permlink: string,
  currentUserName: string | null = null,
  isPromoted = false,
) => {
  author = author && author.toLowerCase();
  permlink = permlink && permlink.toLowerCase();
  try {
    console.log('Getting post: ', author, permlink);
    const post = await client.call('bridge', 'get_post', {author, permlink});
    return post ? parsePost(post, currentUserName, isPromoted) : null;
  } catch (error) {
    return error;
  }
};

export const isPostAvailable = async (author: string, permlink: string) => {
  try {
    const post = await getPurePost(author, permlink);
    return post?.post_id > 0;
  } catch (error) {
    return false;
  }
};

export const getPurePost = async (author: string, permlink: string) => {
  author = author && author.toLowerCase();
  permlink = permlink && permlink.toLowerCase();
  try {
    return await client.call('bridge', 'get_post', {author, permlink});
  } catch (error: any) {
    console.error('Failed to get post', error);
    bugsnagInstance.notify(error);
    throw error;
  }
};

export const deleteComment = (currentAccount: any, pin: string, permlink: string) => {
  const {name: author} = currentAccount;
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  /*   if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    const params = {author, permlink};
    const opArray: any[] = [['delete_comment', params]];
    return api.broadcast(opArray).then(resp => resp.result);
  } */

  if (key) {
    const opArray: Operation[] = [['delete_comment', {author, permlink}]];
    const privateKey = PrivateKey.fromString(key);
    return sendHiveOperations(opArray, privateKey);
  }
};

export const getComments = async (author: string, permlink: string) => {
  const commentsMap = await client.call('bridge', 'get_discussion', {author, permlink});

  // it appear the get_discussion fetches the parent post as an entry in thread
  // may be later we can make use of this to save post fetch call in post display
  // for now, deleting to keep the change footprint small for PR
  delete commentsMap[`${author}/${permlink}`];

  const groomedComments = parseCommentThreads(commentsMap, author, permlink);
  return groomedComments;
};

/**
 * @method getPostWithComments get user data
 * @param username post author
 * @param permlink post permlink
 */
export const getPostWithComments = async (username: string, permlink: string) => {
  const post = await getPost(username, permlink);
  const comments = await getComments(username, permlink);
  return [post, comments];
};

export const signImage = async (file: File, currentAccount: any, pin: any) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    return decryptKey(currentAccount.local.accessToken, digitPinCode);
  } */
  if (key) {
    const message = {
      signed_message: {type: 'posting', app: 'upsteem.app'},
      authors: [currentAccount.name],
      timestamp: Date.now() / 1000,
    };
    const hash = cryptoUtils.sha256(JSON.stringify(message));
    const privateKey = PrivateKey.fromString(key);
    const signature = privateKey.sign(hash).toString();
    // @ts-expect-error
    message.signatures = [signature];
    return b64uEnc(JSON.stringify(message));
  }
};

/**
 * @method getBlockNum return block num based on transaction id
 * @param trx_id transactionId
 */
export const getBlockNum = async (trx_id: string) => {
  try {
    console.log('Getting transaction data', trx_id);
    const transData = await client.call('condenser_api', 'get_transaction', [trx_id]);
    const blockNum = transData.block_num;
    console.log('Block number', blockNum);
    return blockNum;
  } catch (err) {
    console.warn('Failed to get transaction data: ', err);
    return undefined;
  }
};

/**
 * @method upvote upvote a content
 * @param vote vote object(author, permlink, voter, weight)
 * @param postingKey private posting key
 */

export const vote = (
  currentAccount: any,
  pin: string,
  author: string,
  permlink: string,
  weight: any,
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);
  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    const voter = currentAccount.name;

    return api
      .vote(voter, author, permlink, weight)
      .then(result => result.result)
      .catch(err => {
        bugsnagInstance.notify(err);
        return Promise.reject(err);
      });
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const voter = currentAccount.name;
    const opArray: Operation[] = [['vote', {voter, author, permlink, weight}]];
    return sendHiveOperations(opArray, privateKey).catch(err => {
      if (err && err?.jse_info.code === 4030100) {
        err.message = getDsteemDateErrorMessage(err);
      }
      bugsnagInstance.notify(err);
      return Promise.reject(err);
    });
  }

  throw new Error('Check private key permission! Required private posting key or above.');
};

/**
 * @method upvoteAmount estimate upvote amount
 */
export const upvoteAmount = async (input: any) => {
  const rewardFund = await getRewardFund();
  const medianPrice = await client.database.getCurrentMedianHistoryPrice();

  const estimated =
    (input / parseFloat(rewardFund.recent_claims)) *
    parseFloat(rewardFund.reward_balance) *
    (parseFloat(medianPrice.base.toString()) / parseFloat(medianPrice.quote.toString()));
  return estimated;
};

export const transferToken = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    destination: string;
    amount: string;
    memo: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey({activeKey: currentAccount?.local.activeKey}, digitPinCode);
  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args = {
      from: data?.from,
      to: data?.destination,
      amount: data?.amount,
      memo: data?.memo,
    };
    const opArray: Operation[] = [['transfer', args]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const convert = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    amount: string;
    requestId: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'convert',
        {
          owner: data?.from,
          amount: data?.amount,
          requestid: data?.requestId,
        },
      ],
    ];
    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const transferToSavings = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    destination: string;
    amount: string;
    memo: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'transfer_to_savings',
        {
          from: data?.from,
          to: data?.destination,
          amount: data?.amount,
          memo: data?.memo,
        },
      ],
    ];
    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const transferFromSavings = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    destination: string;
    amount: string;
    memo: string;
    requestId: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'transfer_from_savings',
        {
          from: data?.from,
          to: data?.destination,
          amount: data?.amount,
          memo: data?.memo,
          request_id: data?.requestId,
        },
      ],
    ];
    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const transferToVesting = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    destination: string;
    amount: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'transfer_to_vesting',
        {
          from: data.from,
          to: data.destination,
          amount: data.amount,
        },
      ],
    ];

    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const withdrawVesting = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    amount: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'withdraw_vesting',
        {
          account: data.from,
          vesting_shares: data.amount,
        },
      ],
    ];

    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const delegateVestingShares = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    destination: string;
    amount: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'delegate_vesting_shares',
        {
          delegator: data.from,
          delegatee: data.destination,
          vesting_shares: data.amount,
        },
      ],
    ];
    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

/**
 *
 * @param {string} username
 * @param {string} fromDelegatee
 * @param {number} limit
 * @returns {Array} Array of vesting delegation objects [{
 *  delegatee:string;
 *  delegator:string;
 *  id: number;
 *  min_delegation_time: string;
 *  vesting_shares": string'
 * }]
 */
export const getVestingDelegations = async (username: string, fromDelegatee = '', limit = 1000) => {
  try {
    const response = await client.database.call('get_vesting_delegations', [
      username,
      fromDelegatee,
      limit,
    ]);
    console.log('Vested delegatees response', response);
    return response;
  } catch (err: any) {
    console.warn('Failed to get vested delegatees');
    bugsnagInstance.notify(err);
  }
};

export const setWithdrawVestingRoute = (
  currentAccount: any,
  pin: string,
  data: {
    from: string;
    to: string;
    percentage: string;
    autoVest: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const args: Operation[] = [
      [
        'set_withdraw_vesting_route',
        {
          from_account: data.from,
          to_account: data.to,
          percent: data.percentage,
          auto_vest: data.autoVest,
        },
      ],
    ];
    return sendHiveOperations(args, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const getWithdrawRoutes = (account: string) => {
  return client.database.call('get_withdraw_routes', [account, 'outgoing']);
};

export const followUser = async (
  currentAccount: any,
  pin: string,
  data: {
    follower: string;
    following: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(get(currentAccount, 'local.accessToken'), digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    return api.follow(data.follower, data.following);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const json = {
      id: 'follow',
      json: jsonStringify([
        'follow',
        {
          follower: `${data?.follower}`,
          following: `${data?.following}`,
          what: ['blog'],
        },
      ]),
      required_auths: [],
      required_posting_auths: [`${data.follower}`],
    };
    const opArray: Operation[] = [['custom_json', json]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const unfollowUser = async (
  currentAccount: any,
  pin: string,
  data: {
    follower: string;
    following: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    return api.unfollow(data.follower, data.following);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const json = {
      id: 'follow',
      json: jsonStringify([
        'follow',
        {
          follower: `${data?.follower}`,
          following: `${data?.following}`,
          what: [],
        },
      ]),
      required_auths: [],
      required_posting_auths: [`${data.follower}`],
    };
    const opArray: Operation[] = [['custom_json', json]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const markHiveNotifications = async (currentAccount: any, pinHash: string) => {
  const digitPinCode = getDigitPinCode(pinHash);
  const key = getAnyPrivateKey(currentAccount.local, digitPinCode);

  const now = new Date().toISOString();
  const date = now.split('.')[0];

  const params = {
    id: 'notify',
    required_auths: [],
    required_posting_auths: [currentAccount.name],
    json: JSON.stringify(['setLastRead', {date}]),
  };
  // const params1 = {
  //   id: 'upsteem_notify',
  //   required_auths: [],
  //   required_posting_auths: [currentAccount.name],
  //   json: JSON.stringify(['setLastRead', {date}]),
  // };

  const opArray: Operation[] = [
    ['custom_json', params],
    // ['custom_json', params1],
  ];

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount?.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });
    return api.broadcast(opArray).then(resp => resp.result);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const lookupAccounts = async (username: string) => {
  try {
    const users = await client.database.call('lookup_accounts', [username, 20]);
    return users;
  } catch (error) {
    return [];
  }
};

export const getTrendingTags = async (tag: string, number = 20) => {
  try {
    const tags: any[] = await client.database.call('get_trending_tags', [tag, number]);
    return tags;
  } catch (error) {
    return [];
  }
};

export const postContent = (
  account: any,
  pin: string,
  parentAuthor: string,
  parentPermlink: string,
  permlink: string,
  title: string,
  body: string,
  jsonMetadata: any,
  options = null,
  voteWeight = null,
) => {
  return _postContent(
    account,
    pin,
    parentAuthor,
    parentPermlink,
    permlink,
    title,
    body,
    jsonMetadata,
    options,
    voteWeight,
  );
  // .catch(err => {
  //   console.warn('Failed to post content', err);
  //   bugsnagInstance.notify(err);
  //   throw err;
  // });
};

/**
 * Broadcasts a comment to post
 * @param account currentAccount object
 * @param pin encrypted pin taken from redux
 * @param {*} parentAuthor author of parent post or in case of reply to comment author of parent comment
 * @param {*} parentPermlink permlink of parent post or in case of reply to comment author of parent comment
 * @param {*} permlink permlink of comment to be make
 * @param {*} body body of comment
 * @param {*} parentTags tags of parent post or parent comment
 * @param {*} isEdit optional to avoid tracking activity in case of comment editing
 * @returns
 */
export const postComment = (
  account: any,
  pin: string,
  parentAuthor: string,
  parentPermlink: string,
  permlink: string,
  body: string,
  parentTags: any,
) => {
  return _postContent(
    account,
    pin,
    parentAuthor,
    parentPermlink,
    permlink,
    '',
    body,
    makeJsonMetadataReply(parentTags || ['upsteem']),
    null,
    null,
  );
  // .catch(err => {
  //   console.warn('Failed to post content', err);
  //   bugsnagInstance.notify(err);
  //   throw err;
  // });
};

/**
 * @method postComment post a comment/reply
 * @param comment comment object { author, permlink, ... }
 */
const _postContent = async (
  account: any,
  pin: string,
  parentAuthor: string,
  parentPermlink: string,
  permlink: string,
  title: string,
  body: string,
  jsonMetadata: any,
  options = null,
  voteWeight = null,
) => {
  const {name: author} = account;
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(account.local, digitPinCode);

  /* if (account.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(account.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    const params = {
      parent_author: parentAuthor,
      parent_permlink: parentPermlink || '',
      author,
      permlink,
      title,
      body,
      json_metadata: jsonStringify(jsonMetadata),
    };

    const opArray = [['comment', params]];

    if (options) {
      const e = ['comment_options', options];
      opArray.push(e);
    }

    if (voteWeight) {
      const e = [
        'vote',
        {
          voter: author,
          author,
          permlink,
          weight: voteWeight,
        },
      ];
      opArray.push(e);
    }

    return api.broadcast(opArray).then(resp => resp.result);
  } */

  if (key) {
    const opArray: Operation[] = [
      [
        'comment',
        {
          parent_author: parentAuthor,
          parent_permlink: parentPermlink,
          author,
          permlink,
          title,
          body,
          json_metadata: jsonStringify(jsonMetadata),
        },
      ],
    ];

    if (options) {
      const e: Operation = ['comment_options', options];
      opArray.push(e);
    }

    if (voteWeight) {
      const e: Operation = [
        'vote',
        {
          voter: author,
          author,
          permlink,
          weight: voteWeight,
        },
      ];
      opArray.push(e);
    }

    const privateKey = PrivateKey.fromString(key);

    console.log('opArray', opArray);
    return sendHiveOperations(opArray, privateKey).catch(error => {
      if (error && error?.jse_info.code === 4030100) {
        error.message = getDsteemDateErrorMessage(error);
      }
      return Promise.reject(error);
    });
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

// Re-blog
export const reblog = async (account: any, pinCode: string, author: string, permlink: string) => {
  const pin = getDigitPinCode(pinCode);
  const key = getAnyPrivateKey(account.local, pin);

  /* if (account.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(account.local.accessToken, pin);
    const api = new hsClient({
      accessToken: token,
    });
    const follower = account.name;
    return api.reblog(follower, author, permlink).then(resp => resp.result);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const follower = account.name;
    const json = {
      id: 'follow',
      json: jsonStringify([
        'reblog',
        {
          account: follower,
          author,
          permlink,
        },
      ]),
      required_auths: [],
      required_posting_auths: [follower],
    };
    const opArray: Operation[] = [['custom_json', json]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const claimRewardBalance = (
  account: any,
  pinCode: string,
  rewardSteem: string,
  rewardSbd: string,
  rewardVests: string,
) => {
  const pin = getDigitPinCode(pinCode);
  const key = getAnyPrivateKey(account?.local, pin);

  /* if (account.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(get(account, 'local.accessToken'), pin);
    const api = new hsClient({
      accessToken: token,
    });

    return api.claimRewardBalance(get(account, 'name'), rewardHive, rewardHbd, rewardVests);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const opArray: Operation[] = [
      [
        'claim_reward_balance',
        {
          account: account.name,
          reward_steem: rewardSteem,
          reward_sbd: rewardSbd,
          reward_vests: rewardVests,
        },
      ],
    ];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const transferPoint = (currentAccount: any, pinCode: string, data: any) => {
  const pin = getDigitPinCode(pinCode);
  const key = getActiveKey(currentAccount?.local, pin);
  const username = currentAccount?.name;

  const json = JSON.stringify({
    sender: data?.from,
    receiver: data?.destination,
    amount: data?.amount,
    memo: data?.memo,
  });

  if (key) {
    const privateKey = PrivateKey.fromString(key);

    const op = {
      id: 'ecency_point_transfer',
      json,
      required_auths: [username],
      required_posting_auths: [],
    };
    const opArray: Operation[] = [['custom_json', op]];
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const promote = (
  currentAccount: any,
  pinCode: string,
  duration: any,
  permlink: string,
  author: string,
) => {
  const pin = getDigitPinCode(pinCode);
  const key = getActiveKey(currentAccount?.local, pin);

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    const user = currentAccount?.name;

    const json = {
      id: 'ecency_promote',
      json: JSON.stringify({
        user,
        author,
        permlink,
        duration,
      }),
      required_auths: [user],
      required_posting_auths: [],
    };
    const opArray: Operation[] = [['custom_json', json]];

    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const boost = (
  currentAccount: any,
  pinCode: string,
  point: number,
  permlink: string,
  author: any,
) => {
  const pin = getDigitPinCode(pinCode);
  const key = getActiveKey(currentAccount?.local, pin);

  if (key && point) {
    const privateKey = PrivateKey.fromString(key);
    const user = currentAccount?.name;

    const json = {
      id: 'ecency_boost',
      json: JSON.stringify({
        user,
        author,
        permlink,
        amount: `${point.toFixed(3)} POINT`,
      }),
      required_auths: [user],
      required_posting_auths: [],
    };
    const opArray: Operation[] = [['custom_json', json]];

    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const grantPostingPermission = async (json: any, pin: string, currentAccount: any) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(currentAccount?.local, digitPinCode);

  const newPosting = {
    ...currentAccount?.posting,
    account_auths: [
      ...(currentAccount?.posting?.account_auths ?? {}),
      // ['ecency.app', currentAccount?.posting?.weight_threshold],
    ],
  };
  newPosting.account_auths.sort();

  /* if (get(currentAccount, 'local.authType') === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(get(currentAccount, 'local.accessToken'), digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });
    const _params = {
      account: get(currentAccount, 'name'),
      posting: newPosting,
      memo_key: get(currentAccount, 'memo_key'),
      json_metadata: json,
    };

    const opArray: Operation[] = [['account_update', _params]];

    return api
      .broadcast(opArray)
      .then(resp => resp.result)
      .catch(error => {
        console.warn('Failed to update posting key');
        bugsnagInstance.notify(error);
        console.log(error);
      });
  } */

  if (key) {
    const opArray: Operation[] = [
      [
        'account_update',
        {
          account: currentAccount?.name,
          memo_key: currentAccount?.memo_key,
          json_metadata: json,
          posting: newPosting,
        },
      ],
    ];
    const privateKey = PrivateKey.fromString(key);

    return sendHiveOperations(opArray, privateKey).catch(error => {
      if (error && error?.jse_info?.code === 4030100) {
        error.message = getDsteemDateErrorMessage(error);
      }
      console.warn('Failed to update posting key, non-steam', error);
      bugsnagInstance.notify(error);
      return Promise.reject(error);
    });
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const profileUpdate = async (params: any, pin: string, currentAccount: any) => {
  const digitPinCode = getDigitPinCode(pin);
  const key = getAnyPrivateKey(currentAccount?.local, digitPinCode);

  /* if (currentAccount?.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(get(currentAccount, 'local.accessToken'), digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });

    const _params = {
      account: get(currentAccount, 'name'),
      json_metadata: '',
      posting_json_metadata: jsonStringify({profile: params}),
      extensions: [],
    };

    const opArray: Operation[] = [['account_update2', _params]];

    return api
      .broadcast(opArray)
      .then(resp => resp.result)
      .catch(error => console.log(error));
  } */

  if (key) {
    const opArray: Operation[] = [
      [
        'account_update2',
        {
          account: currentAccount?.name,
          json_metadata: '',
          posting_json_metadata: jsonStringify({profile: params}),
          extensions: [],
        },
      ],
    ];
    const privateKey = PrivateKey.fromString(key);
    return sendHiveOperations(opArray, privateKey).catch(error => {
      if (error && error?.jse_info?.code === 4030100) {
        error.message = getDsteemDateErrorMessage(error);
      }
      return Promise.reject(error);
    });
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const subscribeCommunity = (
  currentAccount: any,
  pinCode: string,
  data: {
    isSubscribed: boolean;
    communityId: string;
  },
) => {
  const digitPinCode = getDigitPinCode(pinCode);
  const key = getActiveKey(currentAccount?.local, digitPinCode);
  const username = currentAccount?.name;

  const json = JSON.stringify([
    data.isSubscribed ? 'unsubscribe' : 'subscribe',
    {community: data.communityId},
  ]);

  const op = {
    id: 'community',
    json,
    required_auths: [],
    required_posting_auths: [username],
  };
  const opArray: Operation[] = [['custom_json', op]];

  /*  if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });
    return api.broadcast(opArray);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

export const pinCommunityPost = (
  currentAccount: any,
  pinCode: string,
  communityId: string,
  author: string,
  permlink: string,
  unpinPost = false,
) => {
  const digitPinCode = getDigitPinCode(pinCode);
  const key = getActiveKey(currentAccount?.local, digitPinCode);
  const username = currentAccount?.name;

  const json = JSON.stringify([
    unpinPost ? 'unpinPost' : 'pinPost',
    {
      community: communityId,
      account: author,
      permlink,
    },
  ]);

  const op = {
    id: 'community',
    json,
    required_auths: [],
    required_posting_auths: [username],
  };
  const opArray: Operation[] = [['custom_json', op]];

  /* if (currentAccount.local.authType === AUTH_TYPE.STEEM_CONNECT) {
    const token = decryptKey(currentAccount.local.accessToken, digitPinCode);
    const api = new hsClient({
      accessToken: token,
    });
    return api.broadcast(opArray);
  } */

  if (key) {
    const privateKey = PrivateKey.fromString(key);
    return sendHiveOperations(opArray, privateKey);
  }

  throw new Error('Check private key permission! Required private active key or above.');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getBtcAddress = (pin: string, currentAccount: any) => {
  /* const digitPinCode = getDigitPinCode(pin);
  const key = getActiveKey(get(currentAccount, 'local'), digitPinCode);
  if (key) {
    const keyPair = bitcoin.ECPair.fromWIF(key);
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

    // console.log('btc address', address);
    return { address: address };
  }
  */
  return {
    address: '',
  };
};

// HELPERS

const getAnyPrivateKey = (local: any, pin: string) => {
  const {postingKey, activeKey} = local;
  if (activeKey) {
    return decryptKey(local.activeKey, pin);
  }
  if (postingKey) {
    return decryptKey(local.postingKey, pin);
  }
  return false;
};

const getActiveKey = (local: any, pin: string) => {
  const {activeKey} = local;
  if (activeKey) {
    return decryptKey(local.activeKey, pin);
  }
  return false;
};

export const votingPower = (account: Account) => {
  // @ts-ignore "Account" is compatible with dhive's "ExtendedAccount"
  const calc = client.rc.calculateVPMana(account);
  const {percentage} = calc;
  return percentage / 100;
};
/* eslint-enable max-len */
/* eslint-enable no-bitwise */
