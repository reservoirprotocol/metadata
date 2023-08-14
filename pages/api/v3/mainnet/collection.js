import _ from "lodash";
import axios from "axios";
import slugify from "slugify";

import { extendCollectionMetadata } from "../../../../src/extend";

const getArtBlocksCollection = async (contract, tokenId) => {
  const url = `https://token.artblocks.io/${tokenId}`;
  const { data } = await axios.get(url);

  const startTokenId = tokenId - (tokenId % 1000000);
  const endTokenId = startTokenId + 1000000 - 1;

  return {
    id: `${contract}:${startTokenId}:${endTokenId}`,
    slug: null,
    name: data.collection_name,
    community: "artblocks",
    metadata: {
      imageUrl: `https://media.artblocks.io/${startTokenId}.png`,
      description: data.description,
      externalUrl: data.website,
    },
    royalties: [
      {
        recipient: "0x6c093fe8bc59e1e0cae2ec10f0b717d3d182056b",
        bps: 750,
      },
    ],
    contract,
    tokenIdRange: [startTokenId, endTokenId],
    tokenSetId: `range:${contract}:${startTokenId}:${endTokenId}`,
  };
};

const getOpenSeaCollection = async (contract) => {
  const url = `https://api.opensea.io/api/v1/asset_contract/${contract}`;
  const { data } = await axios.get(url, {
    headers: {
      "x-api-key": process.env.OPENSEA_COLLECTION_API_KEY.trim(),
    },
  });

  if (!data.collection) {
    return {};
  }

  const communities = {
    "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7": "loot",
    "0x8db687aceb92c66f013e1d614137238cc698fedb": "loot",
    "0x1dfe7ca09e99d10835bf73044a23b73fc20623df": "loot",
    "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42": "forgottenrunes",
    "0xf55b615b479482440135ebf1b907fd4c37ed9420": "forgottenrunes",
    "0x31158181b4b91a423bfdc758fc3bf8735711f9c5": "forgottenrunes",
    "0x251b5f14a825c537ff788604ea1b58e49b70726f": "forgottenrunes",
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

      // If collection not found
      if (_.isEmpty(collection)) {
        return res.status(404).json({
          error: `No collection metadata found for ${contract} - ${tokenId}`,
        });
      }

      return res.status(200).json({ collection: await extendCollectionMetadata(1, collection) });
    }
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
