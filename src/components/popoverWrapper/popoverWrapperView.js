import React, {Fragment} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Popover, PopoverController} from 'react-native-modal-popover';

import styles from './popoverWrapperStyles';

function PopoverWrapper({children, text}) {
  return (
    <PopoverController>
      {({openPopover, closePopover, popoverVisible, setPopoverAnchor, popoverAnchorRect}) => (
        <>
          <TouchableOpacity ref={setPopoverAnchor} onPress={openPopover}>
            {children}
          </TouchableOpacity>
          <Popover
            backgroundStyle={styles.overlay}
            contentStyle={styles.popoverDetails}
            arrowStyle={styles.arrow}
            visible={popoverVisible}
            onClose={closePopover}
            fromRect={popoverAnchorRect}
            placement="top"
            supportedOrientations={['portrait', 'landscape']}>
            <View style={styles.popoverWrapper}>
              <Text style={styles.popoverText}>{text}</Text>
            </View>
          </Popover>
        </>
      )}
    </PopoverController>
  );
}

export {PopoverWrapper};
