import { Contract, utils } from "ethers";
import { getProvider } from "../../shared/utils";
import axios from "axios";

export const extend = async (_chainId, metadata) => {
  const provider = getProvider(_chainId);

  const nft = new Contract(
    metadata.contract,
    new utils.Interface(["function immutableAttributeURI(uint256 tokenId) view returns (string)"]),
    provider
  );

  const immutableAttributeURI = await nft.immutableAttributeURI(metadata.tokenId);

  const immutableAttributes = await axios
    .get(immutableAttributeURI)
    .then((response) => response.data?.attributes);

  return {
    ...metadata,
    attributes: [
      ...metadata.attributes,
      ...immutableAttributes.map((a) => ({
        key: a.trait_type,
        value: a.value,
        kind: isNaN(a.value) ? "string" : "number",
      })),
    ],
  };
};
