export const jsonStringify = (jsonMetadata?: string) => {
  if (!jsonMetadata) {
    return '';
  }

  try {
    return JSON.stringify(jsonMetadata);
  } catch (err) {
    return '';
  }
};
