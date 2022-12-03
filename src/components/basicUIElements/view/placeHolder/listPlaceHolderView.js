/* eslint-disable radix */
import React from 'react';
import times from 'lodash/times';

import ListItemPlaceHolder from './listItemPlaceHolderView';
import getWindowDimensions from '../../../../utils/getWindowDimensions';

const HEIGHT = getWindowDimensions().height;

function ListPlaceHolderView() {
  const ratio = (HEIGHT - 300) / 50;
  const listElements = [];

  times(parseInt(ratio), (i) => {
    listElements.push(<ListItemPlaceHolder key={i} />);
  });

  return listElements;
}
export default ListPlaceHolderView;
/* eslint-enable */
