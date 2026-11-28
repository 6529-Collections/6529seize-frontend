import type { Abi, Address, ContractFunctionArgs, ContractFunctionName } from "viem";

/** A write the Stream pages send: checked against its ABI where it is built. */
export interface StreamTxRequest {
  readonly address: Address;
  readonly abi: Abi;
  readonly functionName: string;
  readonly args?: readonly unknown[] | undefined;
  readonly value?: bigint | undefined;
}

type WriteMutability = "nonpayable" | "payable";

/**
 * Builds a write request from a generated `as const` ABI. The function name and
 * the arguments are type-checked against that ABI, so a swapped or missing
 * argument fails to compile; the result is the plain shape the senders take.
 */
export function streamTx<
  const TAbi extends Abi,
  TName extends ContractFunctionName<TAbi, WriteMutability>,
>(request: {
  readonly address: Address;
  readonly abi: TAbi;
  readonly functionName: TName;
  readonly args: ContractFunctionArgs<TAbi, WriteMutability, TName>;
  readonly value?: bigint | undefined;
}): StreamTxRequest {
  return request as unknown as StreamTxRequest;
}
