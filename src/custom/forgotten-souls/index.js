import axios from "axios";
import _ from "lodash";

import souls from "./souls.json";

const rank = {
  Head: 13,
  Body: 12,
  Familiar: 11,
  Prop: 10,
  Rune: 9,
  Background: 8,
  Undesirable: 7,
  Affinity: 6,
  "% Traits in Affinity": 5,
  "# Traits in Affinity": 4,
  "# Traits": 3,
  Title: 2,
  Name: 1,
  Origin: 0,
};

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  let isUndesirable = false;
  let coreTraits = {
    Head: "",
    Body: "",
    Familiar: "",
    Prop: "",
    Rune: "",
  };

  return axios
    .get(`https://portal.forgottenrunes.com/api/souls/data/${tokenId}`)
    .then((response) => {
      const attributes = response.data.attributes.reduce((result, trait) => {
        const traitType = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
        result.push({
          key: traitType,
          rank: rank[traitType] ? rank[traitType] : null,
          value: trait.value,
          kind: "string",
        });

        if (traitType === "Undesirable") {
          isUndesirable = true;
        }

        if (traitType in coreTraits) {
          coreTraits[traitType] = trait.value;
        }

        return result;
      }, []);

      if (!isUndesirable) {
        // Add name traits
        for (var attribute of ["Title", "Name", "Origin"]) {
          if (String(tokenId) in souls) {
            attributes.push({
              key: attribute,
              rank: rank[attribute],
              value: souls[tokenId][attribute.toLowerCase()],
              kind: "string",
            });
          }
        }

        // Add None value for core traits
        for (var trait of ["Head", "Body", "Familiar", "Prop", "Rune"]) {
          if (!coreTraits[trait]) {
            attributes.push({
              key: trait,
              rank: rank[trait],
              value: "None",
              kind: "string",
            });
          }
        }
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
