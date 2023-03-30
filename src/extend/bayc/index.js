import { getStakedAmountWei, stakedAmountWeiToAttributeBucket } from "../apecoin";

const POOL_ID = 1;

export const extend = async (_chainId, metadata) => {
  const traitCount = metadata.attributes.length;

  let stakedAmountWei;
  try {
    const { tokenId } = metadata;
    stakedAmountWei = await getStakedAmountWei({ poolId: POOL_ID, tokenId });
  } catch (error) {
    console.log(error);
  }

  return {
    ...metadata,
    attributes: [
      ...metadata.attributes,
      {
        key: "Trait Count",
        value: traitCount,
        kind: "string",
      },
      {
        key: "ApeCoin Staked",
        value: stakedAmountWeiToAttributeBucket({ stakedAmountWei }),
        kind: "string",
      },
    ],
  };
};
