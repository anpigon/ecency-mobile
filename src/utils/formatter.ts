export const makeCountFriendly = (value: number) => {
  if (!value) {
    return value;
  }
  if (value >= 1000000) {
    return `${intlFormat(value / 1000000)}M`;
  }
  if (value >= 1000) {
    return `${intlFormat(value / 1000)}K`;
  }

  return intlFormat(value);
};

const intlFormat = (num: number) => Math.round(num * 10) / 10;
