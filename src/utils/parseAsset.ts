const parseAsset = (strVal: string) => {
  if (typeof strVal !== 'string') {
    return {
      amount: 0,
      symbol: '',
    };
  }
  const sp = strVal.trim().split(' ');
  return {
    amount: parseFloat(sp[0]),
    symbol: sp[1].trim(),
  };
};

export default parseAsset;
