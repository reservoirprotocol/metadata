import { getStakedAmountWei, stakedAmountWeiToAttributeBucket } from "../apecoin";

const POOL_ID = 2;

export const extend = async (_chainId, metadata) => {
  const traitCount = metadata.attributes.length;
  let serumType;
  let name;

  // M3 apes have no other attributes besides `Name`
  if (metadata.attributes.length === 1) {
    serumType = "Mega";
    name = metadata.attributes[0].value;
  } else {
    serumType = metadata.attributes[0].value.slice(0, 2);
    name = `#${metadata.tokenId} (${serumType})`;
  }

  let stakedAmountWei;
  try {
    const { tokenId } = metadata;
    stakedAmountWei = await getStakedAmountWei({ poolId: POOL_ID, tokenId });
  } catch (error) {
    console.log(error);
  }

  return {
    ...metadata,
    name,
    attributes: [
      ...metadata.attributes,
      {
        key: "Serum Type",
        value: serumType,
        kind: "string",
        rank: 2,
      },
      {
        key: "ApeCoin Staked",
        value: stakedAmountWeiToAttributeBucket({ stakedAmountWei }),
        kind: "string",
      },
      {
        key: "Trait Count",
        value: traitCount,
        kind: "string",
      },
    ],
  };
};
