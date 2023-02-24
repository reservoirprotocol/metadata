import * as opensea from "../../fetchers/opensea";
import { logger } from "../../shared/logger";

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  logger.info(
    "quantum-art",
    `fetchCollection. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}`
  );

  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;
  let data;
  try {
    data = await opensea.fetchCollection(chainId, { contract, tokenId });
  } catch (e) {
    logger.error("quantum-art", `Opensea fetchCollection failed: ${JSON.stringify(e)}`);
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
