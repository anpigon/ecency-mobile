import Clipboard from '@react-native-clipboard/clipboard';

const readFromClipboard = () => Clipboard.getString();

const writeToClipboard = async (text?: string) => {
  if (!text) {
    return false;
  }
  await Clipboard.setString(text);
  return true;
};

export {writeToClipboard, readFromClipboard};
