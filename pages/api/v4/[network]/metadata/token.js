import {
  customHandleContractTokens,
  customHandleToken,
  hasCustomHandler,
} from "../../../../../src/custom";
import { extendMetadata } from "../../../../../src/extend";

import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";
import * as simplehash from "../../../../../src/fetchers/simplehash";
import * as centerdev from "../../../../../src/fetchers/centerdev";
import * as soundxyz from "../../../../../src/fetchers/soundxyz";

import { RequestWasThrottledError, ValidationError } from "../../../../../src/fetchers/errors";

const api = async (req, res) => {
  try {
    // Validate network and detect chain id
    const network = req.query.network;
    if (!["mainnet", "rinkeby", "goerli", "optimism", "polygon"].includes(network)) {
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
      case "polygon":
        chainId = 137;
        break;
    }

    // Validate indexing method and set up provider
    const method = req.query.method;
    if (!["opensea", "rarible", "simplehash", "centerdev", "soundxyz"].includes(method)) {
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
    }

    // Case 1: fetch all tokens within the given contract and slug via pagination
    const collectionSlug = req.query.collectionSlug;
    const continuation = req.query.continuation;
    if (collectionSlug) {
      try {
        if (method !== "opensea") {
          throw new ValidationError("Collection slug is only valid on opensea.");
        }
        const [contract, slug] = collectionSlug.split(":");

        if (hasCustomHandler(chainId, contract)) {
          throw new ValidationError("Custom handler is not supported with collection slug.");
        }
        let newContinuation, previousContinuation;
        const newMetadata = await Promise.all(
          await provider
            .fetchTokensByCollectionSlug(chainId, slug, continuation)
            .then((response) => {
              newContinuation = response.continuation;
              previousContinuation = response.previous;
              return response.assets.map((metadata) => extendMetadata(chainId, metadata));
            })
        );

        return res
          .status(200)
          .json({
            metadata: newMetadata,
            continuation: newContinuation,
            previous: previousContinuation,
          });
      } catch (error) {
        if (error instanceof ValidationError) {
          return res.status(400).json({ error: error.message });
        }
        if (error instanceof RequestWasThrottledError) {
          return res.status(429).json({ error: error.message, expires_in: error.delay });
        }
        throw error;
      }
    }
    // Case 2: fetch all tokens within the given contract via pagination
    const contract = req.query.contract?.toLowerCase();
    if (contract) {
      if (hasCustomHandler(chainId, contract)) {
        const result = await customHandleContractTokens(chainId, contract, continuation);
        return res.status(200).json(result);
      } else {
        try {
          const result = await Promise.all(
            await provider
              .fetchContractTokens(chainId, contract, continuation)
              .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
          );

          return res.status(200).json(result);
        } catch (error) {
          if (error instanceof RequestWasThrottledError) {
            return res.status(429).json({ error: error.message, expires_in: error.delay });
          }
          throw error;
        }
      }
    }

    // Case 3: fetch specific tokens only
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
    if (method === "opensea" && tokens.length > 30) {
      throw new Error("Too many tokens");
    }
    if (method === "rarible" && tokens.length > 50) {
      throw new Error("Too many tokens");
    }
    if (method === "centerdev" && tokens.length > 100) {
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
      try {
        const newMetadata = await Promise.all(
          await provider
            .fetchTokens(chainId, tokens)
            .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
        );

        metadata = [...metadata, ...newMetadata];
      } catch (error) {
        if (error instanceof RequestWasThrottledError) {
          return res.status(429).json({ error: error.message, expires_in: error.delay });
        }
        throw error;
      }
    }

    if (customTokens.length) {
      metadata = [
        ...metadata,
        ...(await Promise.all(customTokens.map((token) => customHandleToken(chainId, token)))),
      ];
    }

    return res.status(200).json({ metadata });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

export default api;
