import { getContractSlug } from "../../custom/soundxyz";

export const extend = async (_chainId, metadata) => {
  try {
    const { data: { data: { nft } } } = await getContractSlug(_chainId, metadata.contract, metadata.tokenId);
    metadata.name = nft.release.title;
    metadata.collection = `${metadata.contract}:soundxyz-${nft.release.id}`;
    metadata.description = nft.release.behindTheMusic;
    metadata.imageUrl = nft.isGoldenEgg ? nft.release.eggGame.goldenEggImage.url : nft.release.coverImage.url,
    metadata.attributes = (nft.openSeaMetadataAttributes || []).map((trait) => ({
      key: trait.traitType || "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    }));

    return { ...metadata };
  } catch (error) {
    throw error
  }
};
