import axios from "axios";
import slugify from "slugify";

import * as opensea from "../../fetchers/opensea";

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/${contract}/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  const { slug, openseaRoyalties } = await opensea
    .fetchCollection(_chainId, { contract, tokenId })
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
    community: data.platform.toLowerCase(),
    metadata: {
      imageUrl: data.image,
      description: data.description,
      externalUrl: data.website,
    },
    openseaRoyalties,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/${contract}/${tokenId}`;
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
    collection: `${contract}:${startTokenId}:${endTokenId}`,
    name: data.name,
    imageUrl: data.image,
    flagged: false,
    attributes,
  };
};
