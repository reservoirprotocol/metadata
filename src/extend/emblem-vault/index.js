import * as hashToSlug from "./hash-to-slug.json";
import * as tokenIdToHash from "./token-id-to-hash.json";

export const extendCollection = async (_chainId, metadata, tokenId) => {
  let id = metadata.id;
  let community = null;

  const hash = tokenIdToHash[tokenId];
  const slug = hash && hashToSlug[hash];
  if (slug) {
    community = "ordinals";
    id = `${id}:ordinals-${slug}`;
  }

  return {
    ...metadata,
    id,
    community,
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
