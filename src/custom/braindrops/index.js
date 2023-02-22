import * as opensea from "../../fetchers/opensea";
import { logger } from "../../shared/logger";
import _ from "lodash";

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  logger.info(
    "custom-braindrops",
    `fetchCollection. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}`
  );

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;
  let data;
  try {
    data = await opensea.fetchCollection(chainId, { contract, tokenId });
  } catch (e) {
    logger.error("custom-braindrops", `Opensea fetchCollection failed: ${JSON.stringify(e)}`);
  }

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug: data.slug,
    name: data.name,
    community: "opensea",
    metadata: {
      imageUrl: data.metadata.imageUrl,
      description: data.metadata.description,
      externalUrl: data.metadata.externalUrl,
    },
    openseaRoyalties: data.openseaRoyalties,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;
  let data;
  try {
    data = await opensea.fetchToken(chainId, contract, tokenId);
  } catch (e) {
    logger.error("custom-braindrops", `Opensea fetchCollection failed: ${JSON.stringify(e)}`);
  }

  return {
    contract,
    tokenId,
    collection: _.toLower(`${contract}:${startTokenId}:${endTokenId}`),
    name: data.name,
    imageUrl: data.imageUrl,
    flagged: false,
    attributes: data.attributes,
  };
};
