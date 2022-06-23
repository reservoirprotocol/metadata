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

    const method = req.query.method;
    if (!["opensea", "rarible", "simplehash"].includes(method)) {
      throw new Error("Unknown method");
    }

    // Paginate through all tokens within the given contract.
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
        let result = null;

        console.log("No custom handler for contract", contract);
        console.log("Fetching from", method);

        if (method === "opensea") {
          console.log("Using opensea");
          result = await Promise.all(
            await opensea
              .fetchContractTokens(chainId, contract, continuation)
              .then((l) =>
                l.map((metadata) => extendMetadata(chainId, metadata))
              )
          );
        } else if (method === "rarible") {
          console.log("Using rarible");
          result = await Promise.all(
            await rarible
              .fetchContractTokens(chainId, contract, continuation)
              .then((l) => {
                l.map((metadata) => extendMetadata(chainId, metadata));
              })
          );
        } else if (method === "simplehash") {
          console.log("Using simplehash");
          result = await Promise.all(
            await simplehash
              .fetchContractTokens(chainId, contract, continuation)
              .then((l) => {
                l.metadata.map((metadata) => extendMetadata(chainId, metadata));
                return l.metadata;
              })
          );
          console.log("Done fetching", result);
        }
        console.log("Done");
        return res.status(200).json(result);
      }
    }

    // Only fetch metadata of specific tokens.
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

    if (method === "opensea" && tokens.length > 20) {
      throw new Error("Too many tokens");
    }
    if (method === "rarible" && tokens.length > 50) {
      throw new Error("Too many tokens");
    }

    // Filter out tokens that have custom handlers.
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
      let newMetadata = null;

      if (method === "opensea") {
        newMetadata = await opensea
          .fetchTokens(chainId, tokens)
          .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)));
      } else if (method === "rarible") {
        newMetadata = await rarible
          .fetchTokens(chainId, tokens)
          .then((l) => l.map((metadata) => extendMetadata(chainId, metadata)));
      } else if (method === "simplehash") {
        newMetadata = await simplehash
          .fetchTokens(chainId, tokens)
          .then((l) => {
            l.map((metadata) => extendMetadata(chainId, metadata));
            return l;
          });
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
