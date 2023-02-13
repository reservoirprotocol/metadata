import * as hashToSlug from "./hash-to-slug.json";
import * as tokenIdToHash from "./token-id-to-hash.json";

export const extendCollection = async (_chainId, metadata) => {
  return {
    ...metadata,
    community: "ordinals",
    tokenIdRange: null,
    tokenSetId: null,
  };
};

export const extend = async (_chainId, metadata) => {
  const contract = metadata.contract;
  const tokenId = metadata.tokenId;

  let collection = contract;

  const hash = tokenIdToHash[tokenId];
  const slug = hash && hashToSlug[hash];
  if (slug) {
    collection = `${collection}:ordinals-${slug}`;
  }

  return {
    ...metadata,
    collection,
  };
};
