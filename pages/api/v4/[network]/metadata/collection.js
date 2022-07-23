import _ from "lodash";

import {
  customHandleCollection,
  hasCustomCollectionHandler,
} from "../../../../../src/custom";
import { extendCollectionMetadata } from "../../../../../src/extend";

import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";
import * as simplehash from "../../../../../src/fetchers/simplehash";

const api = async (req, res) => {
  try {
    // Validate network and detect chain id
    const network = req.query.network;
    if (!["mainnet", "rinkeby", "goerli", "optimism"].includes(network)) {
      throw new Error("Unknown network");
    }

    let chainId = 1;
    switch (network) {
      case "optimism":
        chainId = 10;
        break;
      case "rinkeby":
        chainId = 4;
        break;
      case "goerli":
        chainId = 5;
        break;
    }

    // Validate indexing method and set up provider
    const method = req.query.method;
    if (!["opensea", "rarible", "simplehash"].includes(method)) {
      throw new Error("Unknown method");
    }

    let provider = opensea;
    if (method === "rarible") {
      provider = rarible;
    } else if (method === "simplehash") {
      provider = simplehash;
    }

    const token = req.query.token?.toLowerCase();
    if (!token) {
      throw new Error("Missing token");
    }

    const [contract, tokenId] = token.split(":");

    let collection = null;
    if (hasCustomCollectionHandler(chainId, contract)) {
      collection = await customHandleCollection(chainId, { contract, tokenId });
    } else {
      collection = await provider.fetchCollection(chainId, {
        contract,
        tokenId,
      });
    }

    if (!collection || _.isEmpty(collection)) {
      throw new Error("no collection found");
    }

    return res
      .status(200)
      .json({
        collection: await extendCollectionMetadata(chainId, collection),
      });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
