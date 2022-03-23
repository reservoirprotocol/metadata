import {
  customHandleContractTokens,
  customHandleToken,
  hasCustomHandler,
} from "../../../../../src/custom";
import * as opensea from "../../../../../src/fetchers/opensea";
import * as rarible from "../../../../../src/fetchers/rarible";

const api = async (req, res) => {
  try {
    const network = req.query.network;
    if (!["mainnet", "rinkeby"].includes(network)) {
      throw new Error("Unknown network");
    }

    const chainId = network === "mainnet" ? 1 : 4;

    const method = req.query.method;
    if (!["opensea", "rarible"].includes(method)) {
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
        const result =
          method === "opensea"
            ? await opensea.fetchContractTokens(chainId, contract, continuation)
            : await rarible.fetchContractTokens(
                chainId,
                contract,
                continuation
              );
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

    const metadata = [
      ...(method === "opensea"
        ? await opensea.fetchTokens(chainId, tokens)
        : await rarible.fetchTokens(chainId, tokens)),
      ...(await Promise.all(
        customTokens.map((token) => customHandleToken(chainId, token))
      )),
    ];

    return res.status(200).json({ metadata });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default api;
