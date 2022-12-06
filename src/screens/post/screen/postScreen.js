import React, {Fragment, useEffect} from 'react';

// Components
import {BasicHeader, PostDisplay, PostDropdown} from '../../../components';

function PostScreen({
  currentAccount,
  fetchPost,
  isFetchComments,
  isLoggedIn,
  isNewPost,
  parentPost,
  post,
  isPostUnavailable,
  author,
}) {
  return (
    <>
      <BasicHeader
        isHasDropdown
        title="Post"
        content={post}
        dropdownComponent={<PostDropdown content={post} fetchPost={fetchPost} />}
        isNewPost={isNewPost}
      />
      <PostDisplay
        author={author}
        currentAccount={currentAccount}
        isPostUnavailable={isPostUnavailable}
        fetchPost={fetchPost}
        isFetchComments={isFetchComments}
        isLoggedIn={isLoggedIn}
        isNewPost={isNewPost}
        parentPost={parentPost}
        post={post}
      />
    </>
  );
}

export default PostScreen;
