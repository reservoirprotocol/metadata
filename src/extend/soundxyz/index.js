import { getContractSlug } from "../../custom/soundxyz";

export const extend = async (_chainId, metadata) => {
  try {
    const {
      data: {
        data: { releaseFromToken },
      },
    } = await getContractSlug(_chainId, metadata.contract, metadata.tokenId);
    const isGoldenEgg = releaseFromToken.eggGame?.nft.tokenId === metadata.tokenId;
    let imageUrl =
      releaseFromToken.animatedCoverImage?.url ??
      releaseFromToken.coverImage?.url ??
      releaseFromToken.staticCoverImage?.url;
    if (isGoldenEgg) {
      imageUrl =
        releaseFromToken.eggGame.animatedGoldenEggImageOptimized?.url ??
        releaseFromToken.eggGame.goldenEggImage?.url;
    }

    metadata.name = releaseFromToken.title;
    metadata.collection = `${metadata.contract}:soundxyz-${releaseFromToken.id}`;
    metadata.description = releaseFromToken.behindTheMusic;
    metadata.imageUrl = imageUrl;
    metadata.attributes = (
      (isGoldenEgg
        ? releaseFromToken.eggGame.nft.openSeaMetadataAttributes
        : releaseFromToken.baseMetadataAttributes) || []
    ).map((trait) => ({
      key: trait.traitType || "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    }));

    return { ...metadata };
  } catch (error) {
    throw error;
  }
};
