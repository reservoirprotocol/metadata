import _ from "lodash";
import axios from "axios";
import {logger} from "../../shared/logger";

export const extendCollection = async (_chainId, metadata, tokenId) => {
  if (isNaN(tokenId)) {
    logger.error(
        "artblocks-extendCollection",
        `Invalid tokenId: 
          chainId:${_chainId}, contract:${contract}, tokenId:${tokenId}`
    );
  }

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  return {
    ...metadata,
    community: "artblocks",
    id: `${metadata.contract}:${startTokenId}:${endTokenId}`,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${metadata.contract}:${startTokenId}:${endTokenId}`,
  };
};

export const extend = async (_chainId, metadata) => {
  const startTokenId = metadata.tokenId - (metadata.tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  const url = `https://token.artblocks.io/${metadata.tokenId}`;
  const { data } = await axios.get(url);

  const imageUrl = metadata.imageUrl ?? data.image;
  const mediaUrl = metadata.mediaUrl ?? data.animation_url ?? data.generator_url;

  const attributes = [];
  // Add None value for core traits
  for (const [key, value] of Object.entries(data.features)) {
    attributes.push({
      key,
      rank: 1,
      value,
      kind: "string",
    });
  }

  return {
    ...metadata,
    attributes,
    imageUrl,
    mediaUrl,
    collection: _.toLower(`${metadata.contract}:${startTokenId}:${endTokenId}`),
  };
};
