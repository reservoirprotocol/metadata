import axios from "axios";
import _ from "lodash";
import slugify from "slugify";

import * as opensea from "../../fetchers/opensea";
import { logger } from "../../logger";

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  logger.info(
    "custom-artblocks",
    `fetchCollection. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}`
  );

  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  const { slug, openseaRoyalties } = await opensea
    .fetchCollection(chainId, { contract, tokenId })
    .then((m) => ({
      slug: m.slug,
      openseaRoyalties: m.openseaRoyalties,
    }))
    .catch(() => ({
      slug: slugify(data.collection_name, { lower: true }),
      openseaRoyalties: [],
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
    },
    royalties: [
      {
        recipient: "0x6c093fe8bc59e1e0cae2ec10f0b717d3d182056b",
        bps: 750,
      },
    ],
    openseaRoyalties,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);

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
    imageUrl: data.image,
    flagged: false,
    attributes,
  };
};
