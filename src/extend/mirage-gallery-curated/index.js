import axios from "axios";

function getProjectID(tokenId) {
  let tokenStr = tokenId.toString();
  if (tokenStr.length === 5) {
    return parseInt(tokenStr[0], 10);
  } else if (tokenStr.length === 6) {
    return parseInt(tokenStr.slice(0, 2), 10);
  }
}

export const extendCollection = async (_chainId, metadata, tokenId) => {
  if (isNaN(Number(tokenId))) {
    throw new Error(`Invalid tokenId ${tokenId}`);
  }

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
    isFallback: undefined,
  };
};

export const extend = async (_chainId, metadata) => {
  const startTokenId = metadata.tokenId - (metadata.tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  return {
    ...metadata,
    collection: `${metadata.contract}:${startTokenId}:${endTokenId}`,
  };
};
