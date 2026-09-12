import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import {
  ApiMarketBatchPrepareRequestKindEnum,
  ApiMarketBatchPrepareRequestCurrencyEnum,
  ApiMarketBatchPrepareRequestExecutionPolicyEnum,
} from "@/generated/models/ApiMarketBatchPrepareRequest";
import {
  ApiMarketBatchOperationStateEnum,
  ApiMarketBatchOperationKindEnum,
  ApiMarketBatchOperationExecutionPolicyEnum,
} from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketComponents } from "@/generated/models/ApiMarketComponents";
import { ApiMarketBatchTransactionPurposeEnum } from "@/generated/models/ApiMarketBatchTransaction";
import { MARKET_BATCH_ABI } from "@/components/collect/market-batch-validation";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
  MARKET_ZERO_HASH,
  MARKET_CONDUIT_KEY,
  MARKET_ORDER_TYPES,
  marketTypedData,
} from "@/components/collect/market-validation";
import { encodeFunctionData, hashStruct, hashTypedData, type Hex } from "viem";

export const PAYER = "0x2222222222222222222222222222222222222222";
export const FREN = "0x3333333333333333333333333333333333333333";
export const MAKER = "0x1111111111111111111111111111111111111111";
export const FEE = "0x4444444444444444444444444444444444444444";
export const NOW = 1_800_000_000_000;
const GRADIENT = "0x0c58ef43ff3032005e472cb5709f8908acb00205";
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";

export function batchFixture() {
  const components: ApiMarketComponents[] = [
    { token: GRADIENT, id: "0", quantity: "1", type: 2, net: "90", fee: "10" },
    { token: MEMES, id: "73", quantity: "3", type: 3, net: "54", fee: "6" },
  ].map((item, index) => ({
    offerer: MAKER,
    zone: MARKET_ZERO,
    offer: [
      {
        item_type: item.type,
        token: item.token,
        identifier_or_criteria: item.id,
        start_amount: item.quantity,
        end_amount: item.quantity,
      },
    ],
    consideration: [
      {
        item_type: 0,
        token: MARKET_ZERO,
        identifier_or_criteria: "0",
        start_amount: item.net,
        end_amount: item.net,
        recipient: MAKER,
      },
      {
        item_type: 0,
        token: MARKET_ZERO,
        identifier_or_criteria: "0",
        start_amount: item.fee,
        end_amount: item.fee,
        recipient: FEE,
      },
    ],
    order_type: index,
    start_time: String(NOW / 1000 - 60),
    end_time: String(NOW / 1000 + 3600),
    zone_hash: MARKET_ZERO_HASH,
    salt: String(index),
    conduit_key: MARKET_CONDUIT_KEY,
    counter: "0",
  }));
  const reviewed = components.map((component) => {
    const typed = marketTypedData(component);
    return {
      protocol_address: MARKET_SEAPORT,
      components: component,
      order_hash: hashStruct({
        data: typed.message,
        primaryType: "OrderComponents",
        types: MARKET_ORDER_TYPES,
      }),
      digest: hashTypedData(typed),
    };
  });
  const request: ApiMarketBatchPrepareRequest = {
    kind: ApiMarketBatchPrepareRequestKindEnum.BuyBatch,
    profile_id: "profile",
    wallet: PAYER,
    currency:
      ApiMarketBatchPrepareRequestCurrencyEnum._0x0000000000000000000000000000000000000000,
    execution_policy:
      ApiMarketBatchPrepareRequestExecutionPolicyEnum.AllOrRevert,
    amount_wei: "140",
    items: reviewed.map((order, index) => ({
      asset_key: `1:${index === 0 ? GRADIENT : MEMES}:${index === 0 ? "0" : "73"}`,
      order: { protocol_address: MARKET_SEAPORT, order_hash: order.order_hash },
      quantity: index === 0 ? "1" : "2",
      amount_wei: index === 0 ? "100" : "40",
      allocations:
        index === 0
          ? [
              {
                recipient: FREN,
                quantity: "1",
                acknowledge_external_recipient: true,
              },
            ]
          : [
              {
                recipient: PAYER,
                quantity: "1",
                acknowledge_external_recipient: false,
              },
              {
                recipient: FREN,
                quantity: "1",
                acknowledge_external_recipient: true,
              },
            ],
    })),
  };
  const operation: ApiMarketBatchOperation = {
    id: "batch-operation",
    revision: "1",
    state: ApiMarketBatchOperationStateEnum.Review,
    profile_id: "profile",
    wallet: PAYER,
    currency: MARKET_ZERO,
    total_wei: "140",
    kind: ApiMarketBatchOperationKindEnum.BuyBatch,
    execution_policy: ApiMarketBatchOperationExecutionPolicyEnum.AllOrRevert,
    expires_at: NOW + 60_000,
    updated_at: NOW,
    block_number: 12,
    block_hash: `0x${"a".repeat(64)}`,
    block_timestamp: NOW / 1000,
    potential_liability_wei: "140",
    approval_transactions: [],
    mirror_terms: {
      start_time: String(NOW / 1000),
      end_time: String(NOW / 1000 + 60),
      salt: "88",
    },
    items: request.items.map((item, index) => ({
      ...item,
      allocations: item.allocations.map((allocation) => ({
        ...allocation,
        recipient_in_profile: allocation.recipient === PAYER,
      })),
      reviewed_order: reviewed[index]!,
      net_wei: index === 0 ? "90" : "36",
      fees: [{ recipient: FEE, amount_wei: index === 0 ? "10" : "4" }],
    })),
  };
  const orders = reviewed.map((order, index) => {
    const { counter: _counter, ...parameters } = marketTypedData(
      order.components
    ).message;
    return {
      parameters: { ...parameters, totalOriginalConsiderationItems: 2n },
      numerator: index === 0 ? 1n : 2n,
      denominator: index === 0 ? 1n : 3n,
      signature: "0x1234" as Hex,
      extraData: "0x" as Hex,
    };
  });
  orders.push({
    parameters: {
      offerer: PAYER,
      zone: MARKET_ZERO,
      offer: [
        {
          itemType: 0,
          token: MARKET_ZERO,
          identifierOrCriteria: 0n,
          startAmount: 140n,
          endAmount: 140n,
        },
      ],
      consideration: request.items.flatMap((item, index) =>
        item.allocations.map((allocation) => ({
          itemType: index === 0 ? 2 : 3,
          token: index === 0 ? GRADIENT : MEMES,
          identifierOrCriteria: index === 0 ? 0n : 73n,
          startAmount: BigInt(allocation.quantity),
          endAmount: BigInt(allocation.quantity),
          recipient: allocation.recipient as `0x${string}`,
        }))
      ),
      orderType: 0,
      startTime: BigInt(NOW / 1000),
      endTime: BigInt(NOW / 1000 + 60),
      zoneHash: MARKET_ZERO_HASH as Hex,
      conduitKey: MARKET_ZERO_HASH as Hex,
      salt: 88n,
      totalOriginalConsiderationItems: 3n,
    },
    numerator: 1n,
    denominator: 1n,
    signature: "0x",
    extraData: "0x",
  });
  const links = [
    [0, 0, 2, 0],
    [1, 0, 2, 1],
    [1, 0, 2, 2],
    [2, 0, 0, 0],
    [2, 0, 0, 1],
    [2, 0, 1, 0],
    [2, 0, 1, 1],
  ];
  const fulfillments = links.map((link) => ({
    offerComponents: [
      { orderIndex: BigInt(link[0]!), itemIndex: BigInt(link[1]!) },
    ],
    considerationComponents: [
      { orderIndex: BigInt(link[2]!), itemIndex: BigInt(link[3]!) },
    ],
  }));
  const reencode = () => {
    operation.transaction = {
      chain_id: 1,
      sender: PAYER,
      to: MARKET_SEAPORT,
      value: "140",
      purpose: ApiMarketBatchTransactionPurposeEnum.Fulfill,
      gas_limit: "600000",
      max_fee_per_gas: "10",
      gas_reserve_wei: "6000000",
      data: encodeFunctionData({
        abi: MARKET_BATCH_ABI,
        functionName: "matchAdvancedOrders",
        args: [orders, [], fulfillments, PAYER],
      }),
    };
  };
  reencode();
  return { request, operation, orders, fulfillments, reencode };
}
