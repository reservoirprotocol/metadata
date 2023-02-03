import axios from "axios";
import _ from "lodash";

import warriors from "./warriors.json";

const rank = {
  Head: 14,
  Body: 13,
  Companion: 12,
  Weapon: 11,
  Shield: 10,
  Rune: 9,
  Background: 8,
  Affinity: 7,
  "% Traits in Affinity": 6,
  "# Traits in Affinity": 5,
  "# Traits": 4,
  Name: 3,
  Title: 2,
  Affiliation: 1,
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  var rankCopy = JSON.parse(JSON.stringify(rank));

  return axios
    .get(`https://portal.forgottenrunes.com/api/warriors/data/${tokenId}`)
    .then((response) => {
      const attributes = response.data.attributes.reduce((result, trait) => {
        const traitType = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
        result.push({
          key: traitType,
          rank: rank[traitType] ? rank[traitType] : null,
          value: trait.value,
          kind: "string",
        });

        delete rankCopy[traitType];
        return result;
      }, []);

      // Add Name attributes
      for (var attribute of ["Name", "Title", "Affiliation"]) {
        attributes.push({
          key: attribute,
          rank: rankCopy[attribute] ? rankCopy[attribute] : null,
          value: warriors[tokenId][attribute],
          kind: "string",
        });

        delete rankCopy[attribute];
      }

      // Add 'None' value for missing attributes
      for (var attribute of Object.keys(rankCopy)) {
        attributes.push({
          key: attribute,
          rank: rankCopy[attribute] ? rankCopy[attribute] : null,
          value: "None",
          kind: "string",
        });
      }

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
  const tokenIdRange = [0, 15999];

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
