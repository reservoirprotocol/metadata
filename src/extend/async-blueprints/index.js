import { getCollectionTokenIdRange } from "../../custom/async-blueprints";

export const extend = async (_chainId, metadata) => {
  const collectionTokenIdRange = getCollectionTokenIdRange(metadata.contract, metadata.tokenId);

  if (collectionTokenIdRange) {
    const [startTokenId, endTokenId] = collectionTokenIdRange;
    metadata.collection = `${metadata.contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
  }

  return metadata;
};
