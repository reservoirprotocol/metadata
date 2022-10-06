import axios from "axios";
import { ethers } from "ethers";
import slugify from "slugify";
import { getProvider } from "../../utils";
import ArtistContracts from './ArtistContracts.json';
import ReleaseContracts from './ReleaseContracts.json';

export const fetchCollection = async (_chainId, { contract, tokenId }) => {
    const apiUrl = "https://api.sound.xyz/graphql";
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
    const { data: { data: { nft }}} = await axios.post(
        apiUrl,
        {query: query},
        { headers: { 

            'x-sound-client-key': process.env.SOUNDXYZ_API_KEY,
            'CONTENT-TYPE': 'application/json',
        } }
    )

    const royaltyAbi = ["function royaltyInfo(uint256, uint256) public view returns (address, uint256)"];
    const nftContract = new ethers.Contract(
        contract,
        royaltyAbi,
        getProvider(_chainId)
    );
    const BPS_100 = 10000;
    const [fundingAddress, royaltyBPS] = await nftContract.royaltyInfo(tokenId, BPS_100);

    return {
        id: `${contract}:${nft.release.titleSlug}`,
        slug: slugify(nft.release.titleSlug, { lower: true }),
        name: nft.title,
        community: "sound.xyz",
        metadata: {
          imageUrl: nft.release.coverImage.url,
          description: nft.release.description,
          externalUrl: nft.release.externalUrl,
        },
        royalties: [
          {
            recipient: fundingAddress.toLowerCase(),
            bps: royaltyBPS.toString(),
          },
        ],
        contract,
        tokenIdRange: null,
        tokenSetId: null,
      };
}


export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());
export const SoundxyzReleaseContracts = ReleaseContracts.map((c) => c.toLowerCase());