// 432000 sec = 5 days
const PERIOD = 432000;

export const getVotingPower = (account: any) => {
  const {vp_manabar} = account;
  const {percentage} = vp_manabar || 0;
  return percentage / 100 || 0;
};

export const getRcPower = (account: any) => {
  const {rc_manabar} = account;
  const {percentage} = rc_manabar || 0;
  return percentage / 100 || 0;
};

export const getDownVotingPower = (account: any) => {
  const curMana = Number(account.voting_manabar.current_mana);
  const curDownMana = Number(account.downvote_manabar.current_mana);
  const downManaLastUpdate = account.downvote_manabar.last_update_time;

  const downVotePerc = curDownMana / (curMana / (account.voting_power / 100) / 4);

  const secondsDiff = (Date.now() - downManaLastUpdate * 1000) / 1000;

  const pow = downVotePerc * 100 + (10000 * secondsDiff) / PERIOD;

  return Math.min(pow / 100, 100);
};
