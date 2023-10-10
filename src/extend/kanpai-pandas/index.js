import axios from "axios";

const metadataBaseURI = "https://metadata-api-snag-solutions-ad3b2d55c570.herokuapp.com/api/token";

export const extend = async (_chainId, metadata) => {
  const response = await axios.get(`${metadataBaseURI}/${metadata.tokenId}`);

  const { Attached, Inventory, Rank } = response.data.data;
  const attributes = (Attached || [])
    .map((a) => ({
      key: a.Category,
      value: a.Name,
      kind: "string",
      rank: Rank,
    }))
    .concat(
      (Inventory || []).map((a) => ({
        key: a.Category,
        value: a.Name,
        kind: "string",
        rank: Rank,
      }))
    );
  return {
    ...metadata,
    attributes,
  };
};
