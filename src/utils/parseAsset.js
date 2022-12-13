export default strVal => {
  if (typeof strVal !== 'string') {
    return {
      amount: 0,
      symbol: '',
    };
  }
  const sp = strVal.split(' ');
  return {
    amount: parseFloat(sp[0]),
    symbol: Symbol[sp[1]],
  };
};
