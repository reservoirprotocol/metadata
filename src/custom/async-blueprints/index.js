import * as opensea from "../../fetchers/opensea";

const collectionsTokenIdRange = [
  [0, 665], // Grifters by XCOPY
  [666, 1289], // DecentralEyesMashup by Coldie
];

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
  const metadata = await opensea.fetchCollection(_chainId, { contract, tokenId });

  const collectionTokenIdRange = getCollectionTokenIdRange(contract, tokenId);

  if (collectionTokenIdRange) {
    const [startTokenId, endTokenId] = collectionTokenIdRange;

    metadata.id = `${contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
    metadata.tokenIdRange = [startTokenId, endTokenId];
    metadata.tokenSetId = `range:${contract.toLowerCase()}:${startTokenId}:${endTokenId}`;
  }

  return metadata;
};

export const getCollectionTokenIdRange = (contract, tokenId) => {
  return collectionsTokenIdRange.find(
    (collectionTokenIdRange) =>
      tokenId >= collectionTokenIdRange[0] && tokenId <= collectionTokenIdRange[1]
  );
};
