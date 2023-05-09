import axios from "axios";
import slugify from "slugify";

import * as opensea from "../../fetchers/opensea";
import { logger } from "../../shared/logger";

function getProjectID(tokenId) {
  let tokenStr = tokenId.toString();
  if (tokenStr.length === 5) {
    return parseInt(tokenStr[0], 10);
  } else if (tokenStr.length === 6) {
    return parseInt(tokenStr.slice(0, 2), 10);
  }
}

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
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

  const { slug, openseaRoyalties, openseaFees, safelistRequestStatus } = await opensea
    .fetchCollection(_chainId, { contract, tokenId })
    .then((m) => ({
      slug: m.slug,
      openseaRoyalties: m.openseaRoyalties,
      openseaFees: m.openseaFees,
      safelistRequestStatus: m.metadata?.safelistRequestStatus,
    }))
    .catch(() => ({
      slug: slugify(releaseFromToken.titleSlug, { lower: true }),
      openseaRoyalties: [],
      openseaFees: [],
    }));

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug,
    name: projectDetails.dropName,
    community: "mirage-gallery-curated",
    metadata: {
      imageUrl: projectDetails.image,
      bannerImageUrl: projectDetails.banner,
      description: projectDetails.description,
      externalUrl: extURL,
      safelistRequestStatus,
    },
    royalties,
    openseaRoyalties,
    openseaFees,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
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
  const projectID = getProjectID(tokenId);
  const projectDetails = data.data.find((item) => item.projectId === projectID);

  let metadataURL = projectDetails.metadata;

  if (metadataURL.startsWith("ipfs://")) {
    metadataURL = metadataURL.replace("ipfs://", "https://ipfs.io/ipfs/") + "/" + tokenId;
  } else {
    metadataURL = metadataURL + "/" + tokenId;
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

  for (const [key, value] of Object.entries(data.data.attributes)) {
    attributes.push({
      key,
      rank: 1,
      value,
      kind: "string",
    });
  }

  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  let imageUrl;

  // Try to fetch image from opensea, fallback to ipfs image on failure
  try {
    const osData = await opensea.fetchTokens(_chainId, [{ contract, tokenId }]);
    imageUrl = osData[0].imageUrl ?? data.data.image;
  } catch (e) {
    imageUrl = data.data.image;
  }

  return {
    contract,
    tokenId,
    collection: `${contract}:${startTokenId}:${endTokenId}`,
    name: data.data.name,
    imageUrl,
    flagged: false,
    attributes,
  };
};

let chainId = 1; // replace with your actual chainId
let tokenData = {
  contract: "0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5", // replace with your actual contract
  tokenId: "100001"  // replace with your actual tokenId
};

fetchToken(chainId, tokenData)
  .then(response => {
    console.log(response);  // Handle the response as needed
  })
  .catch(error => {
    console.error(error);  // Handle the error as needed
  });