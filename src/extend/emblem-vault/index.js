import axios from "axios";

export const extendCollection = async (_chainId, metadata, tokenId) => {
  metadata.community = null;
  metadata.tokenIdRange = null;
  metadata.tokenSetId = null;

  await axios
    .get(`https://metadata.ordinals.market/emblem?token_id=${tokenId}`, {
      headers: {
        "X-Api-Key": process.env.ORDINALS_API_KEY,
      },
    })
    .then((response) => {
      const data = response.data;
      if (data.collection) {
        metadata.id = `${metadata.id}:ordinals-${data.collection.id}`;
        metadata.community = "ordinals";
        metadata.name = data.collection.name;
        metadata.metadata = {
          description: data.collection.description,
          imageUrl: data.collection.image_url,
          discordUrl: data.collection.discord_url,
          externalUrl: data.collection.external_url,
          twitterUsername: data.collection.twitter_username,
        };
      }
    })
    .catch(() => {
      // Skip errors
    });

  return metadata;
};

export const extend = async (_chainId, metadata) => {
  await axios
    .get(`https://metadata.ordinals.market/emblem?token_id=${metadata.tokenId}`, {
      headers: {
        "X-Api-Key": process.env.ORDINALS_API_KEY,
      },
    })
    .then((response) => {
      const data = response.data;
      if (data.collection && data.token) {
        metadata.collection = `${metadata.collection}:ordinals-${data.collection.id}`;
        metadata.name = data.token.name;
        metadata.imageUrl = data.token.image_url;
        metadata.attributes = data.token.attributes.map((trait) => ({
          ...trait,
          rank: 1,
        }));
      }
    })
    .catch(() => {
      // Skip errors
    });

  return metadata;
};
