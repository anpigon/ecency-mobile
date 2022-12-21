import {Component} from 'react';
import {Alert} from 'react-native';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';

// Providers
import {gameStatusCheck, gameClaim} from '../providers/ecency/ePoint';
import {RootState} from '../redux/store/store';

type Props = any;
interface State {
  score: number;
  nextDate: any;
  gameRight: number;
  isLoading: boolean;
}

class RedeemContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      score: 0,
      nextDate: null,
      gameRight: 1,
      isLoading: true,
    };
  }

  // Component Life Cycle Functions

  componentDidMount() {
    this._statusCheck();
  }

  // Component Functions
  _statusCheck = async () => {
    const {username} = this.props;

    try {
      const res = await gameStatusCheck(username, 'spin');
      this.setState({
        gameRight: res?.remaining || 0,
        nextDate: res?.next_date || null,
        isLoading: false,
      });
    } catch (err: any) {
      if (err) {
        Alert.alert(err?.message || err.toString());
      }
    }
  };

  _startGame = async (type: string) => {
    const {username} = this.props;
    let gameStatus: any;
    try {
      const res = await gameStatusCheck(username, type);
      gameStatus = res;
    } catch (err: any) {
      if (err) {
        Alert.alert(err?.message || err.toString());
      }
    }

    if (gameStatus?.status !== 18) {
      try {
        const res = await gameClaim(username, type, gameStatus?.key);
        this.setState(
          {
            gameRight: gameStatus?.status !== 3 ? 0 : 5,
            score: res?.score,
          },
          () => this._statusCheck(),
        );
      } catch (err: any) {
        if (err) {
          Alert.alert(err?.message || err.toString());
        }
      }
    } else {
      this.setState({nextDate: gameStatus?.next_date, gameRight: 0});
    }
  };

  render() {
    const {children} = this.props;
    const {score, gameRight, nextDate, isLoading} = this.state;

    return (
      children &&
      children({
        score,
        startGame: this._startGame,
        gameRight,
        nextDate,
        isLoading,
      })
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  username: state.account.currentAccount.name,
});

export default connect(mapStateToProps)(injectIntl(RedeemContainer));
