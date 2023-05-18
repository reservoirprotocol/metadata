import { extendMetadata } from "../../../../../src/extend";

import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";
import * as simplehash from "../../../../../src/fetchers/simplehash";
import * as centerdev from "../../../../../src/fetchers/centerdev";
import * as soundxyz from "../../../../../src/fetchers/soundxyz";
import * as onchain from "../../../../../src/fetchers/onchain";

import { RequestWasThrottledError } from "../../../../../src/fetchers/errors";
import { ValidationError } from "../../../../../src/shared/errors";
import { parse } from "../../../../../src/parsers/opensea";
import _ from "lodash";
import { chains } from "../../../../../src/shared/utils";

const api = async (req, res) => {
  try {
    // Validate network and detect chain id
    const network = req.query.network;
    if (
      !(network in chains)
    ) {
      throw new Error("Unknown network");
    }

    const chainId = chains[network];

    // Validate indexing method and set up provider
    const method = req.query.method;
    if (
      !["opensea", "rarible", "simplehash", "centerdev", "soundxyz", "onchain"].includes(method)
    ) {
      throw new Error("Unknown method");
    }

    if (req.method === "POST") {
      if (method !== "opensea") {
        throw new Error("Unknown method for this endpoint.");
      }
      const body = JSON.parse(JSON.stringify(req.body));
      let metadata = parse(body);
      metadata = await extendMetadata(chainId, metadata);
      return res.status(200).json(metadata);
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

    // Case 1: fetch all tokens within the given contract and slug via pagination
    const collectionSlug = req.query.collectionSlug;
    const continuation = req.query.continuation;
    if (collectionSlug) {
      try {
        if (method !== "opensea") {
          throw new ValidationError("Collection slug is only valid on opensea.");
        }
        const [contract, slug] = collectionSlug.split(":");

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

        return res.status(200).json({
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
    if (contract && !method === "onchain") {
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

    let metadata = [];
    if (tokens.length) {
      try {
        let newMetadata = await Promise.allSettled(
          await provider
            .fetchTokens(chainId, tokens)
            .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)))
        );

        // Filter all rejected promises and return the promise value
        newMetadata = _.map(
          newMetadata.filter((m) => m.status !== "rejected"),
          (m) => m.value
        );

        metadata = [...metadata, ...newMetadata];
      } catch (error) {
        if (error instanceof RequestWasThrottledError) {
          return res.status(429).json({ error: error.message, expires_in: error.delay });
        }
        throw error;
      }
    }

    return res.status(200).json({ metadata });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};

export default api;
