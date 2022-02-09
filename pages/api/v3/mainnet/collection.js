import axios from "axios";
import slugify from "slugify";

const getArtBlocksCollection = async (contract, tokenId) => {
  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = Math.floor(tokenId / 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug: slugify(data.collection_name, { lower: true }),
    name: data.collection_name,
    metadata: {
      description: data.description,
      externalUrl: data.website,
    },
    royalties: {
      recipient: "0x6c093fe8bc59e1e0cae2ec10f0b717d3d182056b",
      bps: 750,
    },
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

const getOpenSeaCollection = async (contract) => {
  const url = `https://api.opensea.io/api/v1/asset_contract/${contract}`;
  const { data } = await axios.get(url, {
    headers: {
      "x-api-key": process.env.OPENSEA_APIKEY.trim(),
    },
  });

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
  // For now, ArtBlocks is the only edge-case where the same
  // underlying contract can have multiple collections in it
  const artblocksAddresses = [
    // Old ArtBlocks contract
    "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a",
    // New ArtBlocks contract
    "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
  ];

  try {
    const contract = req.query.contract?.toLowerCase();
    const tokenId = req.query.tokenId;
    if (!contract || !tokenId) {
      throw new Error("Missing contract and/or tokenId");
    }

    if (artblocksAddresses.includes(contract)) {
      // Use the ArtBlocks API
      const collection = await getArtBlocksCollection(contract, tokenId);
      return res.status(200).json({ collection });
    } else {
      // Default to OpenSea
      const collection = await getOpenSeaCollection(contract);
      return res.status(200).json({ collection });
    }
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
