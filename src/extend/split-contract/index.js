export const extendCollection = async (chainId, metadata, tokenId) => {
    metadata.id = `${metadata.contract}:${metadata.slug}`;
    metadata.tokenIdRange = null;
    metadata.tokenSetId = null;
  
    return { ...metadata };
  };
  
  export const extend = async (chainId, metadata) => {
    metadata.collection = `${metadata.contract}:${metadata.slug}`;
    return { ...metadata };
  };
  