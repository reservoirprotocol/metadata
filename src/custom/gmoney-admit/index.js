import axios from "axios";

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  return axios
    .get(`https://testnet.metadata.g.money/metadata/${tokenId}`)
    .then((response) => {
      return {
        contract,
        tokenId,
        name: response.data.name,
        imageUrl: response.data.image,
        attributes: [],
      };
    });
};

export const fetchContractTokens = (_chainId, contract, continuation) => {
  const pageSize = 1000;
  const tokenIdRange = [1, 1000];

  const minTokenId = continuation
    ? Math.max(continuation, tokenIdRange[0])
    : tokenIdRange[0];
  const maxTokenId = continuation
    ? Math.min(continuation + pageSize, tokenIdRange[1])
    : tokenIdRange[1];

  const assets = [];
  for (let tokenId = minTokenId; tokenId <= maxTokenId; tokenId++) {
    assets.push(fetchToken(_chainId, { contract, tokenId }));
  }

  return {
    continuation: maxTokenId === tokenIdRange[1] ? undefined : maxTokenId + 1,
    metadata,
  };
};
