const filterNsfwPost = (posts: any[], option: '1' | '2') => {
  if (option === '1') {
    return posts.map(post => {
      const nsfw = post.parent_permlink === 'nsfw' || post.json_metadata?.tags?.includes('nsfw');
      return {...post, nsfw};
    });
  }

  // removes nsfw post from array ... filter value '2'
  return posts.filter(post => {
    return post.parent_permlink !== 'nsfw' && !post.json_metadata?.tags?.includes('nsfw');
  });
};

export default filterNsfwPost;
