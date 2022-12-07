export const parse = (contract, tokenId, collection, nft) => {
  return {
    contract: contract,
    tokenId: tokenId,
    collection,
    name: nft.release.title,
    flagged: false,
    description: nft.release.behindTheMusic,
    imageUrl: nft.release.coverImage.url,
    mediaUrl: nft.release.track.revealedAudio.url,
    attributes: (nft.openSeaMetadataAttributes || []).map((trait) => ({
      key: trait.traitType || "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
