import _ from "lodash";

import { extendCollectionMetadata } from "../../../../../src/extend";

import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";
import * as simplehash from "../../../../../src/fetchers/simplehash";
import * as centerdev from "../../../../../src/fetchers/centerdev";
import * as soundxyz from "../../../../../src/fetchers/soundxyz";
import * as onchain from "../../../../../src/fetchers/onchain";

const api = async (req, res) => {
  try {
    // Validate network and detect chain id
    const network = req.query.network;
    if (
      ![
        "mainnet",
        "rinkeby",
        "goerli",
        "optimism",
        "polygon",
        "arbitrum",
        "scroll-alpha",
        "bsc",
        "mantle-testnet",
        "linea-testnet",
        "sepolia",
        "mumbai",
        "base-goerli",
        "arbitrum-nova",
        "misc-testnet",
      ].includes(network)
    ) {
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
      case "bsc":
        chainId = 56;
        break;
      case "polygon":
        chainId = 137;
        break;
      case "arbitrum":
        chainId = 42161;
        break;
      case "scroll-alpha":
        chainId = 534353;
        break;
      case "mantle-testnet":
        chainId = 5001;
        break;
      case "linea-testnet":
        chainId = 59140;
        break;
      case "sepolia":
        chainId = 11155111;
        break;
      case "mumbai":
        chainId = 80001;
        break;
      case "base-goerli":
        chainId = 84531;
        break;
      case "arbitrum-nova":
        chainId = 42170;
        break;
      case "misc-testnet":
        chainId = 999;
        break;
    }

    // Validate indexing method and set up provider
    const method = req.query.method;
    if (
      !["opensea", "rarible", "simplehash", "centerdev", "soundxyz", "onchain"].includes(method)
    ) {
      throw new Error("Unknown method");
    }

    let provider = opensea;
    if (method === "rarible") {
      provider = rarible;
    } else if (method === "simplehash") {
      provider = simplehash;
    } else if (method === "centerdev") {
      provider = centerdev;
    } else if (method === "soundxyz") {
      provider = soundxyz;
    } else if (method === "onchain") {
      provider = onchain;
    }

    const token = req.query.token?.toLowerCase();
    if (!token) {
      throw new Error("Missing token");
    }

    const [contract, tokenId] = token.split(":");
    if (!contract) {
      throw new Error(`Unknown contract ${contract}`);
    }

    if (!tokenId) {
      throw new Error(`Unknown tokenId ${tokenId}`);
    }

    let collection = null;
    collection = await provider.fetchCollection(chainId, {
      contract,
      tokenId,
    });

    if (!collection || _.isEmpty(collection)) {
      throw new Error("No collection found");
    }

    return res.status(200).json({
      collection: await extendCollectionMetadata(chainId, collection, tokenId),
    });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
