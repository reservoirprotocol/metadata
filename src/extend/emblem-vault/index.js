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
    switch(slug) {
      case "bitcoin-punks":
        metadata.name = "Bitcoin Punks"
        metadata.metadata = {
          "description":"Bitcoin Punks are the first byte-perfect uploads of the original Ethereum CryptoPunks onto the Bitcoin Blockchain using Ordinals.",
          "imageUrl":"https://bitcoinpunks.com/punks/punk0205.png",
          "discordUrl": "https://discord.gg/RzvY6UyEes",
          "externalUrl": "https://bitcoinpunks.com/",
          "twitterUsername": "Bitcoin_Punks_"
        }
        break;
    }
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
