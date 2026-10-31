import { createContractWalletReader } from "@/lib/device-signing/contract-wallet-reader";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  HttpRequestError,
  type Hex,
} from "viem";

const ADDRESS: Hex = "0x1111111111111111111111111111111111111111";
const HASH: Hex = `0x${"ab".repeat(32)}`;
const SIGNATURE: Hex = `0x${"cd".repeat(65)}`;
const ABI = [] as const;

const clientWith = ({
  getCode = jest.fn(),
  readContract = jest.fn(),
}: {
  getCode?: jest.Mock;
  readContract?: jest.Mock;
}) => ({ getCode, readContract }) as never;

const wrapped = (cause: Error) =>
  new ContractFunctionExecutionError(cause as never, {
    abi: ABI,
    functionName: "isValidSignature",
    contractAddress: ADDRESS,
  });

describe("contract wallet reader", () => {
  it.each([
    [undefined, false],
    ["0x", false],
    ["0x6080", true],
  ])("reads code %s as hasCode=%s", async (code, expected) => {
    const getCode = jest.fn().mockResolvedValue(code);
    const reader = createContractWalletReader(clientWith({ getCode }));
    await expect(reader.hasCode(ADDRESS)).resolves.toBe(expected);
    expect(getCode).toHaveBeenCalledWith({ address: ADDRESS });
  });

  it("propagates a failed code read", async () => {
    const reader = createContractWalletReader(
      clientWith({ getCode: jest.fn().mockRejectedValue(new Error("rpc")) })
    );
    await expect(reader.hasCode(ADDRESS)).rejects.toThrow("rpc");
  });

  it("returns the EIP-1271 result", async () => {
    const readContract = jest.fn().mockResolvedValue("0x1626ba7e");
    const reader = createContractWalletReader(clientWith({ readContract }));
    await expect(
      reader.isValidSignature({
        address: ADDRESS,
        hash: HASH,
        signature: SIGNATURE,
      })
    ).resolves.toBe("0x1626ba7e");
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ADDRESS,
        functionName: "isValidSignature",
        args: [HASH, SIGNATURE],
      })
    );
  });

  it.each([
    [
      "reverts",
      wrapped(
        new ContractFunctionRevertedError({
          abi: ABI,
          functionName: "isValidSignature",
          message: "not approved",
        })
      ),
    ],
    [
      "returns no data",
      wrapped(
        new ContractFunctionZeroDataError({ functionName: "isValidSignature" })
      ),
    ],
  ])("reads a contract that %s as a rejection", async (_name, error) => {
    const reader = createContractWalletReader(
      clientWith({ readContract: jest.fn().mockRejectedValue(error) })
    );
    await expect(
      reader.isValidSignature({
        address: ADDRESS,
        hash: HASH,
        signature: SIGNATURE,
      })
    ).resolves.toBeNull();
  });

  it.each([
    ["a transport failure", new HttpRequestError({ url: "https://rpc" })],
    ["any other error", new Error("boom")],
  ])("propagates %s", async (_name, error) => {
    const reader = createContractWalletReader(
      clientWith({ readContract: jest.fn().mockRejectedValue(error) })
    );
    await expect(
      reader.isValidSignature({
        address: ADDRESS,
        hash: HASH,
        signature: SIGNATURE,
      })
    ).rejects.toBe(error);
  });
});
