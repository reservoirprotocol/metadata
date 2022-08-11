import {
  customHandleContractTokens,
  customHandleToken,
  hasCustomHandler,
} from "../../../../../src/custom";
import { extendMetadata } from "../../../../../src/extend";

import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";
import * as simplehash from "../../../../../src/fetchers/simplehash";

const api = async (req, res) => {
  try {
    // Validate network and detect chain id
    const network = req.query.network;
    if (!["mainnet", "rinkeby", "optimism"].includes(network)) {
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

    // Case 1: fetch all tokens within the given contract via pagination
    const contract = req.query.contract?.toLowerCase();
    if (contract) {
      const continuation = req.query.continuation;
      if (hasCustomHandler(chainId, contract)) {
        const result = await customHandleContractTokens(
          chainId,
          contract,
          continuation
        );
        return res.status(200).json(result);
      } else {
        const result = await Promise.all(
          await provider
            .fetchContractTokens(chainId, contract, continuation)
            .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
        );

        return res.status(200).json(result);
      }
    }

    // Case 2: fetch specific tokens only
    let tokens = req.query.token;
    if (!tokens) {
      throw new Error("Missing token(s)");
    }
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }
    if (!tokens.length) {
      throw new Error("Missing token(s)");
    }

    tokens = tokens.map((token) => {
      const [contract, tokenId] = token.split(":");
      return {
        contract: contract.toLowerCase(),
        tokenId,
      };
    });

    // Method-specific validations
    if (method === "opensea" && tokens.length > 20) {
      throw new Error("Too many tokens");
    }
    if (method === "rarible" && tokens.length > 50) {
      throw new Error("Too many tokens");
    }

    // Filter out tokens that have custom handlers
    const customTokens = [];
    tokens = tokens.filter((token) => {
      if (hasCustomHandler(chainId, token.contract)) {
        customTokens.push(token);
        return false;
      }
      return true;
    });

    let metadata = [];
    if (tokens.length) {
      let newMetadata;

      if (tokens.length === 1) {
        newMetadata = await Promise.all(
          await provider
            .fetchToken(chainId, tokens[0].contract, tokens[0].tokenId)
            .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
        );
      } else {
        newMetadata = await Promise.all(
          await provider
            .fetchTokens(chainId, tokens)
            .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
        );
      }

      metadata = [...metadata, ...newMetadata];
    }

    if (customTokens.length) {
      metadata = [
        ...metadata,
        ...(await Promise.all(
          customTokens.map((token) => customHandleToken(chainId, token))
        )),
      ];
    }

    return res.status(200).json({ metadata });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

export default api;
