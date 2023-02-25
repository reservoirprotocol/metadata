import axios from "axios";
import slugify from "slugify";

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

  const projectDetails = data.data.find(item => item.projectId === projectID);
  const miragePayoutAddress = data.curatedPayoutAddress;
  const mirageBPS = data.curatedPayoutBPS;
  const artistBPS = data.artistPayoutBPS;

  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  let royalties;

  if (projectDetails.secondaryArtistAddress == "") {
    royalties = [{bps: mirageBPS, recipient: miragePayoutAddress}, {bps: artistBPS, recipient: projectDetails.artistAddress}]
  } else {
    royalties = [{bps: mirageBPS, recipient: miragePayoutAddress}, {bps: artistBPS / 2, recipient: projectDetails.artistAddress}, {bps: artistBPS / 2, recipient: projectDetails.secondaryArtistAddress}]
  }

  let extURL = projectDetails.website
  if (projectDetails.website == "") {
    extURL = "https://miragegallery.ai/curated"
  }

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug: slugify(projectDetails.name, { lower: true }),
    name: projectDetails.dropName,
    metadata: {
      imageUrl: projectDetails.image,
      bannerUrl: projectDetails.banner,
      description: projectDetails.description,
      externalUrl: extURL,
    },
    royalties,
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  const url = `https://account.miragegallery.ai/curated-details.json`;
  let { data } = await axios.get(url);

  const projectID = getProjectID(tokenId);
  const projectDetails = data.data.find(item => item.projectId === projectID);

  let metadataURL = projectDetails.metadata

  if (metadataURL.startsWith('ipfs://')) {
    metadataURL = metadataURL.replace('ipfs://', 'https://ipfs.io/ipfs/') + '/' + tokenId;
  } else {
    metadataURL = metadataURL + '/' + tokenId;
  }

  data  = await axios.get(metadataURL);

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

  return {
    contract,
    tokenId,
    collection: `${contract}:${startTokenId}:${endTokenId}`,
    name: projectDetails.dropName,
    imageUrl: projectDetails.image,
    bannerUrl: projectDetails.banner,
    flagged: false,
    attributes,
  };
};