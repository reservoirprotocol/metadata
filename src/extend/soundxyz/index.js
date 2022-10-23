import { getContractSlug } from "../../custom/soundxyz";

export const extend = async (_chainId, metadata) => {
  try {
    const { data: { data: { nft } } } = await getContractSlug(_chainId, metadata.contract, metadata.tokenId);
    metadata.name = nft.release.title;
    metadata.collection = `${metadata.contract}:soundxyz-${nft.release.id}`;
    metadata.description = nft.release.behindTheMusic;
    metadata.imageUrl = nft.release.coverImage.url;
    return { ...metadata };
  } catch (error) {
    throw error
  }
};
