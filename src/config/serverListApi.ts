import axios from 'axios';
import Config from 'react-native-config';

const serverList = axios.create({
  baseURL: Config.SERVER_LIST_API || 'https://upvu.org/public-nodes.json',
  headers: {
    // Authorization: Config.SERVER_LIST_API,
    'Content-Type': 'application/json',
  },
});

serverList.interceptors.request.use(request => {
  console.log('Starting server list Request', request.url);
  return request;
});

serverList.interceptors.response.use(response => {
  console.log('Response:', response.status, (response as any).url);
  return response;
});

export default serverList;
