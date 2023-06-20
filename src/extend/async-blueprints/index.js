const collectionsTokenIdRange = [
  [0, 665], // Grifters by XCOPY
  [666, 1289], // DecentralEyesMashup by Coldie
];

const getCollectionTokenIdRange = (tokenId) => {
  return collectionsTokenIdRange.find(
    (collectionTokenIdRange) =>
      tokenId >= collectionTokenIdRange[0] && tokenId <= collectionTokenIdRange[1]
  );
};

export const extendCollection = async (_chainId, metadata, tokenId) => {
  if (isNaN(Number(tokenId))) {
    throw new Error(`Invalid tokenId ${tokenId}`);
  }

  const collectionTokenIdRange = getCollectionTokenIdRange(tokenId);

  if (collectionTokenIdRange) {
    const [startTokenId, endTokenId] = collectionTokenIdRange;

    metadata.id = `${contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
    metadata.tokenIdRange = [startTokenId, endTokenId];
    metadata.tokenSetId = `range:${contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
    metadata.isFallback = undefined;
  }

  return metadata;
};

export const extend = async (_chainId, metadata) => {
  const collectionTokenIdRange = getCollectionTokenIdRange(metadata.tokenId);

  if (collectionTokenIdRange) {
    const [startTokenId, endTokenId] = collectionTokenIdRange;
    metadata.collection = `${metadata.contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
  }

  return metadata;
};
