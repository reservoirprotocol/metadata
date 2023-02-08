import axios from "axios";
import _ from "lodash";

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  return axios
    .get(`https://portal.forgottenrunes.com/api/shadowfax/data/${tokenId}`)
    .then((response) => {
      const attributes = response.data.attributes.reduce((result, trait) => {
        const traitType = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
        result.push({
          key: traitType,
          value: trait.value,
          kind: "string",
          rank: 1,
        });
        return result;
      }, []);

      return {
        contract,
        tokenId,
        collection: _.toLower(contract),
        name: response.data.name,
        imageUrl: response.data.image,
        flagged: false,
        attributes,
      };
    });
};

export const fetchContractTokens = (_chainId, contract, continuation) => {
  const pageSize = 1000;
  const tokenIdRange = [0, 9999];

  const minTokenId = continuation ? Math.max(continuation, tokenIdRange[0]) : tokenIdRange[0];
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
