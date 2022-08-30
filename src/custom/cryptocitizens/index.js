import axios from "axios";
import slugify from "slugify";

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug: slugify(data.collection_name, { lower: true }),
    name: data.collection_name,
    community: "cryptocitizens",
    metadata: {
      imageUrl: `https://crypto-citizens-mainnet.s3.amazonaws.com/${startTokenId}.png`,
      description: data.description,
      externalUrl: data.website,
    },
    royalties: [
      {
        recipient: "0xb96e81f80b3aeef65cb6d0e280b15fd5dbe71937",
        bps: 750,
      },
    ],
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const url = `https://token.artblocks.io/0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0/${tokenId}`;
  console.log(url)
  const { data } = await axios.get(url);

  let attributes = []
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
    contract,
    tokenId,
    name: data.name,
    imageUrl: data.image,
    attributes
  };
      
};