import axios from "axios";

import * as opensea from "../../../../src/parsers/opensea";
import * as rarible from "../../../../src/parsers/rarible";
import * as loot from "./custom/0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78";

// OpenSea
const getOpenSeaTokensMetadata = async (contract, tokenIds) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  for (const tokenId of tokenIds) {
    searchParams.append("token_ids", tokenId);
  }

  const url = `https://rinkeby-api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios.get(url).then((response) => response.data);

  const metadata = [];
  for (const asset of data.assets) {
    metadata.push(opensea.parseAssets(asset));
  }

  return metadata;
};

// Rarible
const getRaribleTokensMetadata = async (contract, tokenIds) => {
  const url = "https://ethereum-api-staging.rarible.org/v0.1/nft/items/byIds";
  const data = await axios
    .post(url, {
      ids: tokenIds.map((tokenId) => `${contract}:${tokenId}`),
    })
    .then((response) => response.data);

  const metadata = [];
  for (const item of data) {
    metadata.push(rarible.parse(item));
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
      case "0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78": {
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
