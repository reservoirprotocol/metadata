import { getStakedAmountWei, stakedAmountWeiToAttributeBucket } from "../apecoin";

const POOL_ID = 3;

export const extend = async (_chainId, metadata) => {
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
        key: "ApeCoin Staked",
        value: stakedAmountWeiToAttributeBucket({ stakedAmountWei }),
        kind: "string",
      },
    ],
  };
};
