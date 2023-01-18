export const extend = async (_chainId, metadata) => {
    const [series, tokenNumber] = metadata.name.split("#");

    if (tokenNumber && parseInt(tokenNumber) < 100) {
        metadata.attributes['Token Number'] = 'Double Digits'
    }

    metadata.attributes = {
        Series: series.trim(),
        ... metadata.attributes,
    }

    return metadata;
}