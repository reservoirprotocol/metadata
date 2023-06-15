export const parse = (contract, tokenId, collection, releaseFromToken) => {
  const isGoldenEgg = releaseFromToken.eggGame?.nft.tokenId === tokenId;
  let imageUrl =
    releaseFromToken.animatedCoverImage?.url ??
    releaseFromToken.coverImage?.url ??
    releaseFromToken.staticCoverImage?.url;
  if (isGoldenEgg) {
    imageUrl =
      releaseFromToken.eggGame.animatedGoldenEggImageOptimized?.url ??
      releaseFromToken.eggGame.goldenEggImage?.url;
  }

  return {
    contract: contract,
    tokenId: tokenId,
    collection,
    name: releaseFromToken.title,
    flagged: false,
    description: releaseFromToken.behindTheMusic,
    imageUrl,
    mediaUrl: releaseFromToken.track.revealedAudio.url,
    attributes: (
      (isGoldenEgg
        ? releaseFromToken.eggGame.nft.openSeaMetadataAttributes
        : releaseFromToken.baseMetadataAttributes) || []
    ).map((trait) => ({
      key: trait.traitType ?? "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
