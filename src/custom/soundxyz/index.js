import axios from "axios";
import _ from "lodash";
import { ethers } from "ethers";
import slugify from "slugify";
import { getProvider } from "../../utils";
import ArtistContracts from './ArtistContracts.json';
import ReleaseContracts from './ReleaseContracts.json';
import * as opensea from "../../../src/fetchers/opensea";
import { extendMetadata } from "../../extend";
import { RequestWasThrottledError } from "../../fetchers/errors";

export const getContractSlug = async (chainId, contract, tokenId) => {
  const apiUrl = (chainId === 1 ? "https://api.sound.xyz/graphql" : "https://staging.api.sound.xyz/graphql");

  const query = `
        query ContractSlug {
            nft(input: {
                contractAddress: "${contract}", 
                tokenId: "${tokenId}"
            }) {
                id
                release {
                    id
                    title
                    titleSlug
                    description
                    externalUrl
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
                }
            }
        }
    `
  return await axios.post(
    apiUrl,
    { query },
    { headers: {
        'x-sound-client-key': process.env.SOUNDXYZ_API_KEY,
        'CONTENT-TYPE': 'application/json',
      } }
  )
}

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
    const { data: { data: { nft }}} = await getContractSlug(_chainId, contract, tokenId);

    const royaltyAbi = ["function royaltyInfo(uint256, uint256) public view returns (address, uint256)"];
    const nftContract = new ethers.Contract(
        contract,
        royaltyAbi,
        getProvider(_chainId)
    );
    const BPS_100 = 10000;
    const [fundingAddress, royaltyBPS] = await nftContract.royaltyInfo(tokenId, BPS_100);

    return {
        id: `${contract}:${nft.release.id}`,
        slug: slugify(nft.release.id, { lower: true }),
        name: nft.release.title,
        community: "sound.xyz",
        metadata: {
          imageUrl: nft.release.coverImage.url,
          description: nft.release.description,
          externalUrl: nft.release.externalUrl,
        },
        royalties: [
          {
            recipient: fundingAddress.toLowerCase(),
            bps: Number(royaltyBPS),
          },
        ],
        contract,
        tokenIdRange: null,
        tokenSetId: null,
      };
}

export const fetchToken = async (_chainId, { contract, tokenId }) => {
  try {
    const { data: { data: { nft } } } = await getContractSlug(_chainId, contract, tokenId);

    const newMetadata = await Promise.all(
      await opensea
        .fetchTokens(_chainId, [{contract, tokenId}])
        .then((l) =>
          l.map((metadata) => extendMetadata(_chainId, metadata))
        )
    );

    if (!_.isEmpty(newMetadata)) {
      newMetadata[0].collection = `${contract}:${nft.release.id}`;
      return newMetadata[0];
    }
  } catch (error) {
    if (error instanceof RequestWasThrottledError) {
      return res
        .status(429)
        .json({ error: error.message, expires_in: error.delay });
    }

    throw error
  }
};

export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());
export const SoundxyzReleaseContracts = ReleaseContracts.map((c) => c.toLowerCase());
