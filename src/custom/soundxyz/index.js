import axios from "axios";
import _ from "lodash";
import slugify from "slugify";

import * as opensea from "../../fetchers/opensea";
import { logger } from "../../shared/logger";

import ArtistContracts from "./ArtistContracts.json";
import ReleaseContracts from "./ReleaseContracts.json";

export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());
export const SoundxyzReleaseContracts = ReleaseContracts.map((c) => c.toLowerCase());

export const getContractSlug = async (chainId, contract, tokenId) => {
  const apiUrl =
    chainId === 1
      ? "https://api.sound.xyz/graphql?x-sound-client-name=firstmate"
      : "https://staging.api.sound.xyz/graphql";

  const query = `
        query ContractSlug {
          releaseFromToken(
            input: { contractAddress: "${contract}", tokenId: "${tokenId}" }
          ) {
            baseMetadataAttributes {
              traitType
              value
            }
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
              soundHandle
              user {
                publicAddress
              }
            }
            coverImage {
              url
            }
            staticCoverImage {
               url
            }
            animatedCoverImage {
               url
            }
            eggGame {
              id
              goldenEggImage {
                url
              }
              animatedGoldenEggImageOptimized {
                 url
              }
              nft {
                id
                tokenId
                openSeaMetadataAttributes {
                  traitType
                  value
                }
              }
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
    `;

  try {
    return axios.post(
      apiUrl,
      { query },
      {
        headers: {
          "x-sound-client-key": process.env.SOUNDXYZ_API_KEY,
          "CONTENT-TYPE": "application/json",
          "user-agent": process.env.SOUNDXYZ_USER_AGENT,
        },
      }
    );
  } catch (error) {
    logger.error(
      "soundxyz-fetcher",
      `fetchCollection error. chainId:${chainId}, contract:${contract}, message:${
        error.message
      },  status:${error.response?.status}, data:${JSON.stringify(error.response?.data)}`
    );

    throw error;
  }
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  const {
    data: {
      data: { releaseFromToken },
    },
  } = await getContractSlug(chainId, contract, tokenId);

  const royalties = [];

  if (releaseFromToken.fundingAddress && releaseFromToken.royaltyBps) {
    royalties.push({
      recipient: _.toLower(releaseFromToken.fundingAddress),
      bps: releaseFromToken.royaltyBps,
    });
  }

  const { slug, openseaRoyalties } = await opensea
    .fetchCollection(chainId, { contract, tokenId })
    .then((m) => ({
      slug: m.slug,
      openseaRoyalties: m.openseaRoyalties,
    }))
    .catch(() => ({
      slug: slugify(releaseFromToken.titleSlug, { lower: true }),
      openseaRoyalties: [],
    }));

  return {
    id: `${contract}:soundxyz-${releaseFromToken.id}`,
    slug,
    name: `${releaseFromToken.artist.name} - ${releaseFromToken.title}`,
    community: "sound.xyz",
    metadata: {
      imageUrl: releaseFromToken.coverImage.url,
      description: releaseFromToken.description,
      externalUrl: `https://sound.xyz/${releaseFromToken.artist.soundHandle}/${releaseFromToken.titleSlug}`,
    },
    royalties,
    openseaRoyalties,
    contract,
    tokenIdRange: null,
    tokenSetId: null,
  };
};
