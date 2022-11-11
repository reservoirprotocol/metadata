import axios from "axios";
import { ethers } from "ethers";
import slugify from "slugify";
import { getProvider } from "../../utils";
import ArtistContracts from './ArtistContracts.json';
import ReleaseContracts from './ReleaseContracts.json';
import { logger } from "../../logger";
import _ from "lodash";

export const getContractSlug = async (chainId, contract, tokenId) => {
  const apiUrl = (chainId === 1 ? "https://api.sound.xyz/graphql?x-sound-client-name=firstmate" : "https://staging.api.sound.xyz/graphql");

  const query = `
        query ContractSlug {
            nft(input: {
                contractAddress: "${contract}", 
                tokenId: "${tokenId}"
            }) {
                id
                openSeaMetadataAttributes {
                    traitType
                    value
                }
                release {
                    id
                    title
                    titleSlug
                    behindTheMusic
                    externalUrl
                    behindTheMusic
                    fundingAddress
                    royaltyBps
                    artist {
                        id
                        name
                        user { 
                            publicAddress
                        }
                    }
                    coverImage {
                        url
                    }
                    goldenEggImage {
                        url
                    }
                    track {
                        id
                        revealedAudio {
                          id
                          url
                        }
                    }
                }
            }
        }
    `
  try {
    return await axios.post(
      apiUrl,
      { query },
      {
        headers: {
          'x-sound-client-key': process.env.SOUNDXYZ_API_KEY,
          'CONTENT-TYPE': 'application/json',
        }
      }
    )
  } catch (error) {
    logger.error("soundxyz-fetcher",
      `fetchCollection error. chainId:${chainId}, contract:${contract}, message:${
        error.message
      },  status:${error.response?.status}, data:${JSON.stringify(
        error.response?.data
      )}`);

    throw error;
  }
}

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
    const { data: { data: { nft }}} = await getContractSlug(_chainId, contract, tokenId);
    const royalties = [];

    if (nft.release.fundingAddress && nft.release.royaltyBps) {
      royalties.push({
        recipient: _.toLower(nft.release.fundingAddress),
        bps: nft.release.royaltyBps,
      });
    }

    return {
        id: `${contract}:soundxyz-${nft.release.id}`,
        slug: slugify(nft.release.titleSlug, { lower: true }),
        name: `${nft.release.artist.name} - ${nft.release.title}`,
        community: "sound.xyz",
        metadata: {
          imageUrl: nft.release.coverImage.url,
          description: nft.release.description,
          externalUrl: nft.release.externalUrl,
        },
        royalties,
        contract,
        tokenIdRange: null,
        tokenSetId: null,
      };
}

export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());
export const SoundxyzReleaseContracts = ReleaseContracts.map((c) => c.toLowerCase());
