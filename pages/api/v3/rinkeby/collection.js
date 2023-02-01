import axios from "axios";

import { extendCollectionMetadata } from "../../../../src/extend";

const getOpenSeaCollection = async (contract) => {
  const url = `https://rinkeby-api.opensea.io/api/v1/asset_contract/${contract}`;
  const { data } = await axios.get(url);

  if (!data.collection) {
    throw new Error("Failed to get collection data");
  }

  const communities = {
    "0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78": "loot",
    "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42": "forgottenrunes",
    "0x95082b505c0752eef1806aef2b6b2d55eea77e4e": "forgottenrunes",
    "0x5020c6460b0b26a69c6c0bb8d99ed314f3c39d9e": "forgottenrunes",
    "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85": "ens",
  };

  return {
    id: contract,
    slug: data.collection.slug,
    name: data.collection ? data.collection.name : data.name,
    community: communities[contract] || null,
    metadata: data.collection
      ? {
          description: data.collection.description,
          imageUrl: data.collection.image_url,
          bannerImageUrl: data.collection.banner_image_url,
          discordUrl: data.collection.discord_url,
          externalUrl: data.collection.external_url,
          twitterUsername: data.collection.twitter_username,
        }
      : null,
    royalties: [
      {
        recipient: data.payout_address,
        bps: data.dev_seller_fee_basis_points,
      },
    ],
    contract,
    tokenIdRange: null,
    tokenSetId: `contract:${contract}`,
  };
};

const api = async (req, res) => {
  try {
    const contract = req.query.contract?.toLowerCase();
    const tokenId = req.query.tokenId;
    if (!contract || !tokenId) {
      throw new Error("Missing contract and/or tokenId");
    }

    const collection = await getOpenSeaCollection(contract);
    return res.status(200).json({ collection: await extendCollectionMetadata(4, collection) });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
