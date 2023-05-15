import axios from "axios";
import { logger } from "../../shared/logger";

function getProjectID(tokenId) {
  let tokenStr = tokenId.toString();
  if (tokenStr.length === 5) {
    return parseInt(tokenStr[0], 10);
  } else if (tokenStr.length === 6) {
    return parseInt(tokenStr.slice(0, 2), 10);
  }
}

export const extendCollection = async (_chainId, metadata, tokenId) => {
  const projectID = getProjectID(tokenId);

  const url = `https://account.miragegallery.ai/curated-details.json`;
  const { data } = await axios.get(url);

  const projectDetails = data.data.find((item) => item.projectId === projectID);
  const miragePayoutAddress = data.curatedPayoutAddress;
  const mirageBPS = data.curatedPayoutBPS;
  const artistBPS = data.artistPayoutBPS;

  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  let royalties;

  if (projectDetails.secondaryArtistAddress == "") {
    royalties = [
      { bps: mirageBPS, recipient: miragePayoutAddress },
      { bps: artistBPS, recipient: projectDetails.artistAddress },
    ];
  } else {
    royalties = [
      { bps: mirageBPS, recipient: miragePayoutAddress },
      { bps: artistBPS / 2, recipient: projectDetails.artistAddress },
      { bps: artistBPS / 2, recipient: projectDetails.secondaryArtistAddress },
    ];
  }

  let extURL = projectDetails.website;
  if (projectDetails.website == "") {
    extURL = "https://miragegallery.ai/curated";
  }

  return {
    ...metadata,
    community: "mirage-gallery-curated",
    id: `${metadata.contract}:${startTokenId}:${endTokenId}`,
    metadata: {
      ...metadata.metadata,
      imageUrl: projectDetails.image,
      bannerImageUrl: projectDetails.banner,
      description: projectDetails.description,
    },
    royalties,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${metadata.contract}:${startTokenId}:${endTokenId}`,
  };
};

export const extend = async (_chainId, metadata) => {
  let data;
  try {
    const response = await axios.get(`https://account.miragegallery.ai/curated-details.json`);
    data = response.data;
  } catch (error) {
    logger.error(
      "mirage-gallery-curated-fetcher",
      `fetchTokens get json error. chainId:${_chainId}, message:${error.message}, status:${
        error.response?.status
      }, data:${JSON.stringify(error.response?.data)}`
    );

    throw error;
  }
  const projectID = getProjectID(metadata.tokenId);
  const projectDetails = data.data.find((item) => item.projectId === projectID);

  let metadataURL = projectDetails.metadata;

  if (metadataURL.startsWith("ipfs://")) {
    metadataURL = metadataURL.replace("ipfs://", "https://ipfs.io/ipfs/") + "/" + metadata.tokenId;
  } else {
    metadataURL = metadataURL + "/" + metadata.tokenId;
  }

  try {
    data = await axios.get(metadataURL);
  } catch (error) {
    logger.error(
      "mirage-gallery-curated-fetcher",
      `fetchTokens get metadataURL error. chainId:${_chainId}, metadataURL=${metadataURL}, message:${
        error.message
      }, status:${error.response?.status}, data:${JSON.stringify(error.response?.data)}`
    );

    throw error;
  }

  const attributes = [];

  for (const item of data.data.attributes) {
    const key = item.trait_type ? item.trait_type : "Property";
    const value = item.value;

    attributes.push({
      key,
      rank: 1,
      value,
      kind: "string",
    });
  }

  const startTokenId = metadata.tokenId - (metadata.tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  return {
    ...metadata,
    attributes,
    collection: `${metadata.contract}:${startTokenId}:${endTokenId}`,
  };
};
