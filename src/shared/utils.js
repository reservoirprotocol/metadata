import { providers } from "ethers";
import _ from "lodash";
import { normalizeLink } from "../parsers/onchain";

export const getProvider = (chainId) => {
  const network = _.upperCase(supportedChains[chainId]).replace(" ", "_");
  return new providers.JsonRpcProvider(process.env[`RPC_URL_${network}`]);
};

// Supported chains with key=network, value=chainId
export const supportedNetworks = process.env.SUPPORTED_CHAINS.split(",").reduce(
  (acc, val) => ((acc[val.split(":")[1]] = Number(val.split(":")[0])), acc),
  {}
);

// Supported chains with key=chainId, value=network
export const supportedChains = process.env.SUPPORTED_CHAINS.split(",").reduce(
  (acc, val) => ((acc[Number(val.split(":")[0])] = val.split(":")[1]), acc),
  {}
);

export const normalizeMetadata = (collection) => {
  if (!collection) {
    return {};
  }
  let map = {
    discord: {
      key: "discordUrl",
    },
    discord_url: {
      key: "discordUrl",
    },
    twitter_username: {
      key: "twitterUsername",
      normalize: (value) => {
        // if the value is a url, return the username
        if (value?.includes("twitter.com")) {
          return value.split("/")[3];
        }

        return value;
      },
    },
    twitter: {
      key: "twitterUrl",
      normalize: (value) => {
        if (value?.includes("twitter.com")) {
          return value;
        }
        // if the value is a username, return the url
        return `https://twitter.com/${value}`;
      },
    },
    telegram: {
      key: "telegramUrl",
      normalize: (value) => {
        if (value?.includes("t.me")) {
          return value;
        }

        return `https://t.me/${value}`;
      },
    },
    instagram: {
      key: "instagramUrl",
      normalize: (value) => {
        if (value?.includes("instagram.com")) {
          return value;
        }
      },
    },
    medium: {
      key: "mediumUrl",
    },
    github: {
      key: "githubUrl",
    },
    website: {
      key: "externalUrl",
      normalize: (value) => normalizeLink(value),
    },
    website_url: {
      key: "externalUrl",
      normalize: (value) => normalizeLink(value),
    },
    external_url: {
      key: "externalUrl",
      normalize: (value) => normalizeLink(value),
    },
    image: {
      key: "imageUrl",
      normalize: (value) => normalizeLink(value),
    },
    image_url: {
      key: "imageUrl",
      normalize: (value) => normalizeLink(value),
    },
    cover_image: {
      key: "bannerImageUrl",
      normalize: (value) => normalizeLink(value),
    },
    banner_image_url: {
      key: "bannerImageUrl",
      normalize: (value) => normalizeLink(value),
    },
    safelist_request_status: {
      key: "safelistRequestStatus",
    },
    name: {
      key: "name",
    },
    description: {
      key: "description",
    },
  };

  let metadata = {};
  if (collection?.social_urls) {
    Object.keys(collection.social_urls).forEach((key) => {
      if (key in map) {
        if (map[key].normalize) {
          metadata[map[key].key] = map[key].normalize(collection.social_urls[key]);
        } else {
          metadata[map[key].key] = collection.social_urls[key];
        }
      }
    });
  }

  // do the above via the map
  Object.keys(map).forEach((key) => {
    if (key in collection) {
      if (map[key].normalize) {
        metadata[map[key].key] = map[key].normalize(collection[key]);
      } else {
        metadata[map[key].key] = collection[key];
      }
    }
  });

  return metadata;
};
