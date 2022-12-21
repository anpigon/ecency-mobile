import {connect} from 'react-redux';
import {RootState} from '../redux/store/store';

interface Props {
  children: any;
  isDarkTheme: boolean;
}

const ThemeContainer = ({children, isDarkTheme}: Props) => {
  return (
    children &&
    children({
      isDarkTheme,
    })
  );
};

const mapStateToProps = (state: RootState) => ({
  isDarkTheme: state.application.isDarkTheme,
});

export default connect(mapStateToProps)(ThemeContainer);
