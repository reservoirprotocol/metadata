import web3 from 'web3';
import fetch from 'node-fetch';
import {fileTypeFromBuffer} from 'file-type'

const FETCH_TIMEOUT = 30000;

let Web3Local = new web3(
    web3.httpProvider(null)
);

let Web3Instances = [];
let Web3InstanceMax = 10;
for (let i = 0; i < Web3InstanceMax; i++) {
    Web3Instances.push(new web3(process.env.MAINNET_RPC_URL));
}


const getWeb3 = () => {
    const instance = Web3Instances.shift();
    Web3Instances.push(instance);
    return instance;
};

setInterval(() => {
    // Every 10 minutes, we refresh the web3 instances to bring old memory out of scope to avoid memory leaks
    Web3Instances = [];
    for (let i = 0; i < Web3InstanceMax; i++) {
        Web3Instances.push(new web3(process.env.MAINNET_RPC_URL));
    }
}, 60 * 1000);

const encodeTokenID = tokenId => {
    return {
        id: tokenId,
        encodedTokenID: Web3Local.eth.abi.encodeFunctionCall(
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


// TODO: Implement this, maybe we just use the OpenSea API for this, not sure
export const getCollectionMetadata = async (contractAddress, chainId) => {

}

export const fetchContractTokens = async (contractAddress, chainId) => {
    if (chainId !== 1) throw new Error('Only mainnet is supported');
    // TODO: Add support for other chains


    // TODO: Add support for ERC-1155 and other standards, this is just ERC-721
    const transferABI = [
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'to',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'uint256',
                    name: 'tokenId',
                    type: 'uint256',
                },
            ],
            name: 'Transfer',
            type: 'event',
        },
    ];

    const contract = new (getWeb3()).eth.Contract(
        transferABI,
        contractAddress,
    );


    const tokenIds = [];
    const start = 0;
    
    // current block number + 3 to make sure we get all the events
    const end = await (getWeb3()).eth.getBlockNumber() + 3;
    const tokens = await getTokenIds(contract, start, end, tokenIds);

    return new Set(tokens);        
}

// Recursive function to fetch all the events, in case the contract has too many events (> 10000)
const getTokenIds = async (contract, start, end, tokenIds) => {
    try {
        const results = await contract.getPastEvents('Transfer', {
            filter: { from: '0x0000000000000000000000000000000000000000' },
            fromBlock: start,
            toBlock: end,
        });

        if (results.length > 0) {
            tokenIds = tokenIds.concat(
                results.map(event => event.returnValues.tokenId),
            );
        }
        return tokenIds;
    } catch (e) {
        const middle = Math.round((start + end) / 2);
        return [
            ...(await getTokenIds(contract, start, middle + 1, tokenIds)),
            ...(await getTokenIds(contract, middle + 1, end, tokenIds)),
        ];
    }
};