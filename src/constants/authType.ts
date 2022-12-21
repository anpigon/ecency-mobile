const STEEM_CONNECT = 'steemConnect';
const MASTER_KEY = 'masterKey';
const ACTIVE_KEY = 'activeKey';
const MEMO_KEY = 'memoKey';
const POSTING_KEY = 'postingKey';

const AUTH_TYPE = {
  STEEM_CONNECT,
  MASTER_KEY,
  ACTIVE_KEY,
  MEMO_KEY,
  POSTING_KEY,
} as const;

export default AUTH_TYPE;
