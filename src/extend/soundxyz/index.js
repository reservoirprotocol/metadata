import { getContractSlug } from "../../custom/soundxyz";

export const extend = async (_chainId, metadata) => {
  try {
    const { data: { data: { nft } } } = await getContractSlug(_chainId, metadata.contract, metadata.tokenId);
    metadata.collection = `${metadata.contract}:soundxyz-${nft.release.id}`;
    return { ...metadata };
  } catch (error) {
    throw error
  }
};