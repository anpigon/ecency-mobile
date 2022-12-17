import axios from 'axios';
import Config from 'react-native-config';

export const upload = (
  fd: any,
  username: string,
  signature: string,
  uploadProgress: (progressEvent: any) => void,
) => {
  const image = axios.create({
    baseURL: `${Config.NEW_IMAGE_API}/hs/${signature}`, // Config.NEW_IMAGE_API
    headers: {
      Authorization: Config.NEW_IMAGE_API, // Config.NEW_IMAGE_API
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: uploadProgress,
  });

  image.interceptors.request.use(request => {
    console.log('Starting image Request', request.url);
    return request;
  });

  image.interceptors.response.use(response => {
    console.log('Response:', response.status, (response as any).url);
    return response;
  });

  return image.post('', fd);
};
