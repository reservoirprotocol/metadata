import { getContractSlug } from "../../custom/soundxyz";
import ArtistContracts from "./ArtistContracts.json";
import ReleaseContracts from "./ReleaseContracts.json";
import { logger } from "../../logger";

export const extend = async (_chainId, metadata) => {
  try {
    const { data: { data: { nft } } } = await getContractSlug(_chainId, metadata.contract, metadata.tokenId);
    metadata.collection = `${metadata.contract}:soundxyz-${nft.release.id}`;
    return { ...metadata };
  } catch (error) {
    logger.error("soundxyz-fetcher",
      `fetchCollection error. chainId:${_chainId}, contract:${metadata.contract}, message:${
        error.message
      },  status:${error.response?.status}, data:${JSON.stringify(
        error.response?.data
      )}`);

    throw error
  }
};

export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());
export const SoundxyzReleaseContracts = ReleaseContracts.map((c) => c.toLowerCase());