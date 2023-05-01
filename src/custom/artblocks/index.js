import axios from "axios";
import _ from "lodash";
import slugify from "slugify";

import * as opensea from "../../fetchers/opensea";
import { logger } from "../../shared/logger";

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  logger.info(
    "custom-artblocks",
    `fetchCollection. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}`
  );

  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  const { slug, openseaRoyalties, openseaFees, safelistRequestStatus } = await opensea
    .fetchCollection(chainId, { contract, tokenId })
    .then((m) => ({
      slug: m.slug,
      openseaRoyalties: m.openseaRoyalties,
      openseaFees: m.openseaFees,
      safelistRequestStatus: m.metadata?.safelistRequestStatus,
    }))
    .catch(() => ({
      slug: slugify(data.collection_name, { lower: true }),
      openseaRoyalties: [],
      openseaFees: [],
    }));

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug,
    name: data.collection_name,
    community: "artblocks",
    metadata: {
      imageUrl: `https://media.artblocks.io/${startTokenId}.png`,
      description: data.description,
      externalUrl: data.website,
      safelistRequestStatus,
    },
    openseaRoyalties,
    openseaFees,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);
  let imageUrl;
  let mediaUrl;

  // Try to fetch image from opensea, fallback to artblocks image on failure
  try {
    const osData = await opensea.fetchTokens(_chainId, [{ contract, tokenId }]);
    imageUrl = osData[0].imageUrl ?? data.image;
    mediaUrl = osData[0].mediaUrl ?? data.animation_url ?? data.generator_url;
  } catch (e) {
    imageUrl = data.image;
    mediaUrl = data.generator_url;
  }

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

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  return {
    contract,
    tokenId,
    collection: _.toLower(`${contract}:${startTokenId}:${endTokenId}`),
    name: data.name,
    imageUrl,
    mediaUrl,
    flagged: false,
    attributes,
  };
};
