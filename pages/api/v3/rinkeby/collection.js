import axios from "axios";

const getOpenSeaCollection = async (contract) => {
  const url = `https://rinkeby-api.opensea.io/api/v1/asset_contract/${contract}`;
  const { data } = await axios.get(url);

  return {
    id: contract,
    slug: data.collection.slug,
    name: data.collection.name,
    metadata: {
      description: data.collection.description,
      imageUrl: data.collection.image_url,
      bannerImageUrl: data.collection.banner_image_url,
      discordUrl: data.collection.discord_url,
      externalUrl: data.collection.external_url,
      twitterUsername: data.collection.twitter_username,
    },
    royalties: {
      recipient: data.collection.payout_address,
      bps: data.collection.dev_seller_fee_basis_points,
    },
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
    return res.status(200).json({ collection });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
