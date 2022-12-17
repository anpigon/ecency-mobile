import {useState, useEffect} from 'react';

import {useNavigation} from '@react-navigation/native';
import {isBefore} from '../utils/time';

import ROUTES from '../constants/routeNames';

interface Props {
  data: any[];
  children: Function;
}

const AccountListContainer: React.FC<Props> = ({data, children}) => {
  const navigation = useNavigation();

  const [vData, setVData] = useState(data);
  const [filterResult, setFilterResult] = useState<any[] | null>(null);
  const [filterIndex, setFilterIndex] = useState(0);

  useEffect(() => {
    setVData(data);
  }, [data]);

  const _handleSearch = (searchText: string, key: string) => {
    const newData = vData.filter(item => {
      const itemName = item[key].toUpperCase();
      const _text = searchText.toUpperCase();
      return itemName.indexOf(_text) > -1;
    });

    if (filterIndex !== 0) {
      _handleOnVotersDropdownSelect(filterIndex, newData);
    } else {
      setFilterResult(newData);
    }
  };

  const _handleOnVotersDropdownSelect = (index: number, oldData: any) => {
    const _data = Object.assign([], oldData || vData);

    if (filterIndex === index) {
      switch (index) {
        case 0:
          _data.sort((a: any, b: any) => Number(a.value) - Number(b.value));
          break;
        case 1:
          _data.sort((a: any, b: any) => a.percent - b.percent);
          break;
        case 2:
          _data.sort((a: any, b: any) => isBefore(b.time, a.time));
          break;
      }
    } else {
      switch (index) {
        case 0:
          _data.sort((a: any, b: any) => Number(b.value) - Number(a.value));
          break;
        case 1:
          _data.sort((a: any, b: any) => b.percent - a.percent);
          break;
        case 2:
          _data.sort((a: any, b: any) => isBefore(a.time, b.time));
          break;
      }
    }
    setFilterResult(_data);
    setFilterIndex(index);
  };

  const _handleOnUserPress = (username: string) => {
    // @ts-ignore
    navigation.navigate(ROUTES.SCREENS.PROFILE, {
      name: ROUTES.SCREENS.PROFILE,
      params: {
        username,
      },
      key: username,
    });
  };

  return (
    children &&
    children({
      data,
      filterResult,
      filterIndex,
      handleOnVotersDropdownSelect: _handleOnVotersDropdownSelect,
      handleSearch: _handleSearch,
      handleOnUserPress: _handleOnUserPress,
    })
  );
};

export default AccountListContainer;
