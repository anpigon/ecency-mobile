import {getPost, getUser} from '../providers/hive/dhive';
import postUrlParser from './postUrlParser';
import parseAuthUrl, {AUTH_MODES} from './parseAuthUrl';
import ROUTES from '../constants/routeNames';
import parsePurchaseUrl from './parsePurchaseUrl';

export const deepLinkParser = async (url: string, currentAccount: any) => {
  if (!url || url.indexOf('ShareMedia://') >= 0) return;

  let routeName;
  let params;
  let content;
  let profile;
  let key;

  // profess url for post/content
  const postUrl = postUrlParser(url);
  console.log('postUrl : ', postUrl);

  const {author, permlink, feedType, tag} = postUrl || {};

  if (author) {
    if (
      !permlink ||
      permlink === 'wallet' ||
      permlink === 'points' ||
      permlink === 'comments' ||
      permlink === 'replies' ||
      permlink === 'posts'
    ) {
      let deepLinkFilter;
      if (permlink) {
        deepLinkFilter = permlink === 'points' ? 'wallet' : permlink;
      }

      profile = await getUser(author);
      routeName = ROUTES.SCREENS.PROFILE;
      params = {
        username: profile?.name,
        reputation: profile?.reputation,
        deepLinkFilter, // TODO: process this in profile screen
      };
      key = profile?.name;
    } else if (permlink === 'communities') {
      routeName = ROUTES.SCREENS.WEB_BROWSER;
      params = {
        url,
      };
      key = 'WebBrowser';
    } else if (permlink) {
      content = await getPost(author, permlink, currentAccount.name);
      routeName = ROUTES.SCREENS.POST;
      params = {
        content,
      };
      key = `${author}/${permlink}`;
    }
  }

  if (feedType === 'hot' || feedType === 'trending' || feedType === 'created') {
    if (!tag) {
      routeName = ROUTES.SCREENS.TAG_RESULT;
    } else if (/hive-[1-3]\d{4,6}$/.test(tag)) {
      routeName = ROUTES.SCREENS.COMMUNITY;
    } else {
      routeName = ROUTES.SCREENS.TAG_RESULT;
    }
    params = {
      tag,
      filter: feedType,
    };
    key = `${feedType}/${tag || ''}`;
  }

  // process url for authentication
  if (!routeName) {
    const data = parseAuthUrl(url);
    if (data) {
      const {mode, referredUser, username, code} = data;

      if (mode === AUTH_MODES.SIGNUP) {
        routeName = ROUTES.SCREENS.REGISTER;
        params = {
          referredUser,
        };
        key = `${mode}/${referredUser || ''}`;
      }

      if (mode === AUTH_MODES.AUTH) {
        routeName = ROUTES.SCREENS.LOGIN;
        params = {
          username,
          code,
        };
        key = `${mode}/${username || ''}`;
      }
    }
  }

  // process url for purchasing
  if (!routeName) {
    const {type, username, productId} = parsePurchaseUrl(url) || {};

    if (type && type === 'boost') {
      routeName = ROUTES.SCREENS.ACCOUNT_BOOST;
      params = {
        username,
      };
      key = `${type}/${username || ''}`;
    }
    if (type && type === 'points') {
      routeName = ROUTES.SCREENS.BOOST;
      params = {
        username,
        productId,
      };
      key = `${type}/${username || ''}`;
    }
  }

  return {
    name: routeName,
    params,
    key,
  };
};
