import axios from "axios";

import * as loot from "./custom/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7";

// OpenSea
const getOpenSeaTokensMetadata = async (contract, tokenIds) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  for (const tokenId of tokenIds) {
    searchParams.append("token_ids", tokenId);
  }

  const url = `https://api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers: {
        "X-API-KEY": process.env.OPENSEA_APIKEY.trim(),
      },
    })
    .then((response) => response.data);

  const metadata = [];
  for (const asset of data.assets) {
    metadata.push({
      contract: asset.asset_contract.address,
      tokenId: asset.token_id,
      name: asset.name,
      description: asset.description,
      image: asset.image_url,
      attributes: asset.traits.map((trait) => {
        return {
          key: trait.trait_type,
          value: trait.value,
          kind: isNaN(trait.value) ? "string" : "number",
          rank: 1,
        };
      }),
    });
  }

  return metadata;
};

// Rarible
const getRaribleTokensMetadata = async (contract, tokenIds) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  for (const tokenId of tokenIds) {
    searchParams.append("token_ids", tokenId);
  }

  const url = "https://ethereum-api.rarible.org/v0.1/nft/items/byIds";
  const data = await axios
    .post(url, {
      ids: tokenIds.map((tokenId) => `${contract}:${tokenId}`),
    })
    .then((response) => response.data);

  const metadata = [];
  for (const item of data) {
    // Image
    let imageUrl = null;
    try {
      imageUrl = item.meta.image.url[Object.keys(item.meta.image.meta)[0]];
    } catch (error) {
      // Skip any errors
    }

    // Attributes
    const attributes = item.meta.attributes.reduce((result, trait) => {
      if (trait.value) {
        result.push({
          key: trait.key,
          value: trait.value,
          kind: isNaN(trait.value) ? "string" : "number",
          rank: 1,
        });
      }
      return result;
    }, []);

    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    metadata.push({
      contract: item.contract,
      tokenId: item.tokenId,
      name: item.meta.name,
      imageUrl: imageUrl,
      attributes,
    });
  }

  return metadata;
};

const api = async (req, res) => {
  try {
    const method = req.query.method;
    if (!["opensea", "rarible"].includes(method)) {
      throw new Error("Unknown method");
    }

    const contract = req.query.contract?.toLowerCase();
    if (!contract) {
      throw new Error("Missing contract");
    }

    let tokenIds = req.query.tokenIds;
    if (!tokenIds) {
      throw new Error("Missing tokenIds");
    }
    if (!Array.isArray(tokenIds)) {
      tokenIds = [tokenIds];
    }
    if (method === "opensea" && tokenIds.length > 20) {
      throw new Error("Too many tokens");
    }
    if (method === "rarible" && tokenIds.length > 50) {
      throw new Error("Too many tokens");
    }

    let metadata;
    switch (contract) {
      case "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7": {
        metadata = tokenIds.map((tokenId) => loot.getTokenMetadata(tokenId));
        break;
      }

      default: {
        if (method === "opensea") {
          metadata = await getOpenSeaTokensMetadata(contract, tokenIds);
        } else if (method === "rarible") {
          metadata = await getRaribleTokensMetadata(contract, tokenIds);
        }
        break;
      }
    }

    return res.status(200).json({ metadata });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
