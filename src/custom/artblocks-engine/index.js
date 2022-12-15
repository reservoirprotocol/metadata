import axios from "axios";
import slugify from "slugify";
import * as opensea from "../../fetchers/opensea";

const customRoyalties = {
  "0x13aae6f9599880edbb7d144bb13f1212cee99533": 1000,
  "0x62e37f664b5945629b6549a87f8e10ed0b6d923b": 1000,
};

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/${contract}/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  const { slug, openseaRoyalties } = await opensea
      .fetchCollection(_chainId, { contract, tokenId })
      .then((m) => ({
        slug: m.slug,
        openseaRoyalties: m.openseaRoyalties
      }))
      .catch(() => ({
        slug: slugify(data.collection_name, { lower: true }),
        openseaRoyalties: []
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
    royalties: [
      {
        recipient: data.payout_address,
        bps: customRoyalties[contract] || 750,
      },
    ],
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
