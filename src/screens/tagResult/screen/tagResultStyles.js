import EStyleSheet from 'react-native-extended-stylesheet';

export default EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '$primaryBackgroundColor',
  },
  backIcon: {
    fontSize: 24,
    color: '$iconColor',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  buttonContainer: {
    width: '50%',
    alignItems: 'center',
  },
  tabbar: {
    alignSelf: 'center',
    height: 40,
    backgroundColor: '$primaryBackgroundColor',
    shadowOpacity: 0.2,
    shadowColor: '$shadowColor',
    shadowOffset: {height: 4},
    zIndex: 99,
    borderBottomColor: '$shadowColor',
    borderBottomWidth: 0.1,
  },
  tabbarItem: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '$primaryBackgroundColor',
    minWidth: '$deviceWidth',
  },
  tabs: {
    flex: 1,
  },
});
