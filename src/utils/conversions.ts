export const vestsToHp = (vests: string, hivePerMVests: number) => {
  if (!vests || !hivePerMVests) {
    return 0;
  }

  return (parseFloat(vests) / 1e6) * hivePerMVests;
};

export const hpToVests = (hp: string, hivePerMVests: number) => {
  if (!hp || !hivePerMVests) {
    return 0;
  }
  return (parseFloat(hp) * 1e6) / hivePerMVests;
};

export const vestsToRshares = (vests: number, votingPower: number, weight: number) => {
  if (!vests || !votingPower || !weight) {
    return 0;
  }

  const finalVest = vests * 1e6;
  const power = (votingPower * weight) / 10000 / 50;
  return (power * finalVest) / 1000;
};
