const collectionsTokenIdRange = [
  [
    "Winslow Homer's Croquet Challenge by Mitchell F. Chan",
    "25811853076941608055270457512038717433705462539422789705262203111341130500760",
    "25811853076941608055270457512038717433705462539422789705262203111341130501225",
  ],
];

const getCollectionTokenIdRange = (contract, tokenId) => {
  return collectionsTokenIdRange.find(
    (collectionInfo) =>
      collectionInfo[1] <= tokenId.toString() && tokenId.toString() <= collectionInfo[2]
  );
};

export const extendCollection = async (chainId, metadata, tokenId) => {
  const collection = getCollectionTokenIdRange(metadata.contract, metadata.tokenId);

  if (collection) {
    const [collectionName, startTokenId, endTokenId] = collection;
    metadata.name = collectionName;
    metadata.id = `${metadata.contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
    metadata.tokenIdRange = [start, end];
    metadata.tokenSetId = `range:${contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
  }
  return metadata;
};

export const extend = async (_chainId, metadata) => {
  const collection = getCollectionTokenIdRange(metadata.contract, metadata.tokenId);

  if (collection) {
    const [collectionName, startTokenId, endTokenId] = collection;
    metadata.name = collectionName;
    metadata.collection = `${metadata.contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
  }

  return metadata;
};
