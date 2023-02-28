import web3 from 'web3';
import fetch from 'node-fetch';
import {fileTypeFromBuffer} from 'file-type'

const FETCH_TIMEOUT = 30000;

const Web3 = new web3(
  process.env.MAINNET_RPC_URL
);

const encodeTokenID = tokenId => {
    return {
        id: tokenId,
        encodedTokenID: Web3.eth.abi.encodeFunctionCall(
            {
                name: 'tokenURI',
                type: 'function',
                inputs: [
                    {
                        type: 'uint256',
                        name: 'tokenId',
                    },
                ],
            },
            [tokenId],
        ),
    };
};

const createBatch = (encodedTokens, contractAddress) => {
    return encodedTokens.map(token => {
        return {
            jsonrpc: '2.0',
            id: token.id,
            method: 'eth_call',
            params: [
                {
                    data: token.encodedTokenID,
                    to: contractAddress,
                },
                'latest',
            ],
        };
    });
};

const sendBatch = async (encodedTokens, contractAddress, RPC_URL) => {
    const response = await fetch(
       RPC_URL,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createBatch(encodedTokens, contractAddress)),
            timeout: FETCH_TIMEOUT,
            // TODO: add proxy support to avoid rate limiting
            // agent: 
        },
    );
    const json = await response.json();
    return json;
};

const getTokenMetadataFromURI = async uri => {
    try {
        const response = await fetch(uri, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: FETCH_TIMEOUT,
            // TODO: add proxy support to avoid rate limiting
            // agent: 
        });

        if (!response.ok) {
            return [null, response.status];
        }

        const json = await response.json();
        return [json, null];
    } catch (e) {
        return [null, e.message];
    }
};

const getImageFromURI = async uri => {
    try {
        if (uri.includes('ipfs://')) {
            uri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }
        if (!uri.includes('http')) {
            return [null, 'Invalid URL'];
        }
        const res = await nodeFetch(uri, {
            method: 'GET',
            timeout: FETCH_TIMEOUT,
            // TODO: add proxy support to avoid rate limiting
            // agent: 
        });
        const buffer = await res.buffer();
        return [buffer, null];
    } catch (e) {
        return [null, e.message];
    }
};

const getImage = async (uri) => {
    const [imageBuffer, error] = await getImageFromURI(uri);
    if (error) {
        return [null, error];
    }

    const type = await fileTypeFromBuffer(imageBuffer);
    if (!type) {
        return [null, 'Invalid image type'];

    }

    return [{ uri, buffer: imageBuffer, type: type.ext }, null];
};

export const getTokenMetadata = async (tokenIds, contractAddress, chainId) => {
    // TODO: Add support for other chains
    // TODO: Add support for ERC-1155 and other standards
    if (tokenIds.length === 0) return [];
    if (!Array.isArray(tokenIds)) tokenIds = [tokenIds];
    if (tokenIds.length > 10) throw new Error('Too many tokenIds (max 20)');
    if (chainId !== 1) throw new Error('Only mainnet is supported');

    const RPC_URL = process.env.MAINNET_RPC_URL;
    const encodedTokens = tokenIds.map(encodeTokenID);
    const batch = await sendBatch(
        encodedTokens,
        contractAddress,
        RPC_URL,
    );
    
    const resolvedMetadata = await Promise.all(
        batch.map(async token => {
            const metadata = await getTokenMetadataFromURI(
                token.uri,
            );
            if (metadata[1]) {
                return {
                    id: token.id,
                    metadata: null,
                };
            }

            let image = null;
            if (metadata[0].image) {
                image = await getImage(metadata.image);
            }   
            
            return {
                id: token.id,
                metadata: {
                    ...metadata[0],
                    image: image ? image[0] : null,
                },
            };
                
        }),
    );

    return resolvedMetadata;
};


// TODO: Implement this
export const getCollectionMetadata = async (contractAddress, chainId) => {

}

export const fetchContractTokens = async (contractAddress, chainId) => {
    // Implement this by fetching the contract's events and filtering for Transfer events where the from address is 0x0, and the to address is the contract address
    // Then, parse the tokenIds from the event data and build the array of all tokenIds that belong to the contract
}