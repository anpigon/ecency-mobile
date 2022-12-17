import getSlug from 'speakingurl';
import {diff_match_patch as diffMatchPatch} from 'diff-match-patch';
import VersionNumber from 'react-native-version-number';
import MimeTypes from 'mime-types';

export const getWordsCount = (text: string) =>
  text && typeof text === 'string' ? text.replace(/^\s+|\s+$/g, '').split(/\s+/).length : 0;

export const generateRndStr = () => (Math.random() + 1).toString(16).substring(2);

export const generatePermlink = (title: string, random = false) => {
  if (!title) {
    return '';
  }

  // TODO: check special character processing
  const slug = getSlug(title);
  let perm = slug && slug.toString();

  if (title) {
    // make shorter url if possible
    const shortp = perm.split('-');
    if (shortp.length > 5) {
      perm = shortp.slice(0, 5).join('-');
    }

    if (random) {
      const rnd = generateRndStr();
      perm = `${perm}-${rnd}`;
    }

    // STEEMIT_MAX_PERMLINK_LENGTH
    if (perm.length > 255) {
      perm = perm.substring(perm.length - 255, perm.length);
    }

    // only letters numbers and dashes
    perm = perm.toLowerCase().replace(/[^a-z0-9-]+/g, '');

    if (perm.length === 0) {
      return generateRndStr();
    }
  }

  return perm;
};

export const extractWordAtIndex = (text: string, index: number) => {
  const RANGE = 50;

  const _start = index - RANGE;
  const _end = index + RANGE;

  const _length = text.length;

  const textChunk = text.substring(_start > 0 ? _start : 0, _end < _length ? _end : _length);
  const indexChunk =
    index < 50 ? index : _length - index < 50 ? textChunk.length - (_length - index) : RANGE;

  console.log('char at index: ', textChunk[indexChunk]);

  const END_REGEX = /[\s,]/;
  let word = '';
  for (let i = indexChunk; i >= 0 && (!END_REGEX.test(textChunk[i]) || i === indexChunk); i--) {
    if (textChunk[i]) {
      word += textChunk[i];
    }
  }
  word = word.split('').reverse().join('');

  if (!END_REGEX.test(textChunk[indexChunk])) {
    for (let i = indexChunk + 1; i < textChunk.length && !END_REGEX.test(textChunk[i]); i++) {
      if (textChunk[i]) {
        word += textChunk[i];
      }
    }
  }

  return word;
};

export const generateReplyPermlink = (toAuthor?: string) => {
  if (!toAuthor) {
    return '';
  }

  const t = new Date(Date.now());

  const timeFormat = `${t.getFullYear().toString()}${(t.getMonth() + 1).toString()}${t
    .getDate()
    .toString()}t${t.getHours().toString()}${t.getMinutes().toString()}${t
    .getSeconds()
    .toString()}${t.getMilliseconds().toString()}z`;

  return `re-${toAuthor.replace(/\./g, '')}-${timeFormat}`;
};

export const makeOptions = (postObj: any) => {
  if (!postObj.author || !postObj.permlink) {
    return {};
  }

  const result: any = {
    allow_curation_rewards: true,
    allow_votes: true,
    author: postObj.author,
    permlink: postObj.permlink,
    max_accepted_payout: '1000000.000 SBD',
    percent_steem_dollars: 10000,
    extensions: [],
  };
  switch (postObj.operationType) {
    case 'sp':
      result.max_accepted_payout = '1000000.000 SBD';
      result.percent_steem_dollars = 0;
      if (postObj.beneficiaries && postObj.beneficiaries.length > 0) {
        postObj.beneficiaries.sort((a, b) => a.account.localeCompare(b.account));
        result.extensions = [[0, {beneficiaries: postObj.beneficiaries}]];
      }
      break;

    case 'dp':
      result.max_accepted_payout = '0.000 SBD';
      result.percent_steem_dollars = 10000;
      if (postObj.beneficiaries && postObj.beneficiaries.length > 0) {
        postObj.beneficiaries.sort((a, b) => a.account.localeCompare(b.account));
        result.extensions = [[0, {beneficiaries: postObj.beneficiaries}]];
      }
      break;

    default:
      result.max_accepted_payout = '1000000.000 SBD';
      result.percent_steem_dollars = 10000;
      if (postObj.beneficiaries && postObj.beneficiaries.length > 0) {
        postObj.beneficiaries.sort((a: any, b: any) => a.account.localeCompare(b.account));
        result.extensions = [[0, {beneficiaries: postObj.beneficiaries}]];
      }
      break;
  }

  return result;
};

export const makeJsonMetadataReply = (tags: any[]) => ({
  tags,
  app: `ecency/${VersionNumber.appVersion}-mobile`,
  format: 'markdown+html',
});

export const makeJsonMetadata = (meta: any, tags: any[]) => ({
  ...meta,
  tags,
  app: `ecency/${VersionNumber.appVersion}-mobile`,
  format: 'markdown+html',
});

export const makeJsonMetadataForUpdate = (oldJson: any, meta: any, tags: any[]) => {
  return {
    ...oldJson,
    meta: {
      ...oldJson.meta,
      ...meta,
    },
    tags,
  };
};

const extractUrls = (body?: string) => {
  const urlReg = /(\b(https?|ftp):\/\/[A-Z0-9+&@#/%?=~_|!:,.;-]*[-A-Z0-9+&@#/%=~_|])/gim;
  const mUrls = body && body.match(urlReg);
  return mUrls || [];
};

export const extractImageUrls = ({body, urls}: {body?: string; urls?: string[]}) => {
  const imgReg = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|heic|webp))/gim;
  const mUrls = urls || extractUrls(body);
  return mUrls.filter(url => {
    const isImage = url.match(imgReg);
    return isImage;
  });
};

export const extractFilenameFromPath = ({path, mimeType}: {path: string; mimeType?: string}) => {
  try {
    if (!path) {
      throw new Error('path not provided');
    }
    const filenameIndex = path.lastIndexOf('/') + 1;
    const extensionIndex = path.lastIndexOf('.');
    if (filenameIndex < 0 || extensionIndex <= filenameIndex) {
      throw new Error('file name not present with extension');
    }
    return path.substring(path.lastIndexOf('/') + 1);
  } catch (err) {
    let _ext = 'jpg';
    if (mimeType) {
      _ext = MimeTypes.extension(mimeType).toString();
    }
    return `${generateRndStr()}.${_ext}`;
  }
};

export const extractMetadata = (body: string, thumbUrl?: string) => {
  const userReg = /(^|\s)(@[a-z][-.a-z\d]+[a-z\d])/gim;

  const results: any = {};

  const mUrls = extractUrls(body);
  const mUsers = body && body.match(userReg);

  const matchedImages = extractImageUrls({urls: mUrls});
  const matchedLinks: any[] = [];
  const matchedUsers: any[] = [];

  if (mUrls) {
    mUrls.forEach(url => {
      if (matchedImages.indexOf(url) < 0) {
        matchedLinks.push(url);
      }
    });
  }

  if (matchedLinks.length) {
    results.links = matchedLinks.slice(0, 10); // return only first 10 links
  }

  if (matchedImages.length) {
    if (thumbUrl) {
      matchedImages.sort(item => (item === thumbUrl ? -1 : 1));
    }

    results.image = matchedImages.slice(0, 10); // return only first 10 images
  }

  if (mUsers) {
    for (let i = 0; i < mUsers.length; i++) {
      matchedUsers.push(mUsers[i].trim().substring(1));
    }
  }

  if (matchedUsers.length) {
    results.users = matchedUsers.slice(0, 10); // return only first 10 users
  }

  return results;
};

export const createPatch = (text1: string, text2: string) => {
  if (!text1 && text1 === '') {
    return undefined;
  }

  const dmp = new diffMatchPatch();
  const patches = dmp.patch_make(text1, text2);
  const patch = dmp.patch_toText(patches);

  return patch;
};

export const delay = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};
