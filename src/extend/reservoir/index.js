export const extendCollection = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  let startTokenId;
  let endTokenId;

  if (tokenId < 10) {
    startTokenId = 0;
    endTokenId = 9;
  } else {
    startTokenId = 10;
    endTokenId = 10000;
  }

  metadata.id = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  return { ...metadata };
};


export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  let startTokenId;
  let endTokenId;

  if (tokenId < 10) {
    startTokenId = 0;
    endTokenId = 9;
  } else {
    startTokenId = 10;
    endTokenId = 10000;
  }

  metadata.collection = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  return { ...metadata };
}