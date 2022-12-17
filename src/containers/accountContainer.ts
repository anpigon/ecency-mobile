import React from 'react';

import {useAppSelector} from '../hooks';

const AccountContainer: React.FC<any> = ({children}) => {
  const accounts = useAppSelector(state => state.account.otherAccounts);
  const currentAccount = useAppSelector(state => state.account.currentAccount);
  const isLoggedIn = useAppSelector(state => state.application.isLoggedIn);
  const isLoginDone = useAppSelector(state => state.application.isLoginDone);
  const username = useAppSelector(state => state.account.currentAccount.name);
  return (
    children &&
    children({
      accounts,
      currentAccount,
      isLoggedIn,
      isLoginDone,
      username,
    })
  );
};

export default AccountContainer;
