export const jsonStringify = (jsonMetadata?: any) => {
  if (!jsonMetadata) {
    return '';
  }

  try {
    return JSON.stringify(jsonMetadata);
  } catch (err) {
    return '';
  }
};
