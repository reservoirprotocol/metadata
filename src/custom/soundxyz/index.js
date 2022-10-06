import axios from "axios";
import slugify from "slugify";
import ArtistContracts from './ArtistContracts.json';

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
            recipient: nft.release.artist.user.publicAddress,
            bps: 1000,
          },
        ],
        contract,
        tokenIdRange: null,
        tokenSetId: null,
      };
}


export const SoundxyzArtistContracts = ArtistContracts.map((c) => c.toLowerCase());