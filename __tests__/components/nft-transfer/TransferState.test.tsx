import { act, renderHook } from "@testing-library/react";

import {
  buildTransferKey,
  TransferProvider,
  useTransfer,
} from "@/components/nft-transfer/TransferState";
import { ContractType } from "@/types/enums";

function renderTransfer() {
  return renderHook(() => useTransfer(), { wrapper: TransferProvider });
}

describe("TransferState", () => {
  it("initialises with transfer disabled and no selections", () => {
    const { result } = renderTransfer();

    expect(result.current.enabled).toBe(false);
    expect(result.current.count).toBe(0);
    expect(result.current.totalQty).toBe(0);
    expect(result.current.selected.size).toBe(0);
  });

  it("allows selecting, updating quantities and clearing items", () => {
    const { result } = renderTransfer();

    const key = buildTransferKey({ collection: "MEMES", tokenId: 1 });
    act(() => {
      result.current.setEnabled(true);
      result.current.select({
        key,
        contract: "0xabc",
        contractType: ContractType.ERC721,
        tokenId: 1,
        title: "Test",
        thumbUrl: "thumb",
        qty: 5,
        max: 2,
      });
    });

    expect(result.current.enabled).toBe(true);
    expect(result.current.count).toBe(1);
    expect(result.current.totalQty).toBe(2);

    act(() => {
      result.current.incQty(key);
    });
    expect(result.current.selected.get(key)?.qty).toBe(2);

    act(() => {
      result.current.decQty(key);
      result.current.decQty(key);
    });
    expect(result.current.selected.get(key)?.qty).toBe(1);

    act(() => {
      result.current.clear();
    });
    expect(result.current.count).toBe(0);
    expect(result.current.totalQty).toBe(0);
  });

  it("toggleSelect adds new item first and removes if toggled again", () => {
    const { result } = renderTransfer();

    const first = {
      key: buildTransferKey({ collection: "A", tokenId: 1 }),
      contract: "0x1",
      contractType: ContractType.ERC721,
      tokenId: 1,
    };
    const second = {
      key: buildTransferKey({ collection: "B", tokenId: 2 }),
      contract: "0x2",
      contractType: ContractType.ERC1155,
      tokenId: 2,
      max: 10,
    };

    act(() => {
      result.current.toggleSelect(first);
      result.current.toggleSelect(second);
    });

    const keys = Array.from(result.current.selected.keys());
    expect(keys[0]).toBe(second.key);
    expect(keys).toContain(first.key);

    act(() => {
      result.current.toggleSelect(second);
    });
    expect(result.current.selected.has(second.key)).toBe(false);
    expect(result.current.count).toBe(1);
  });
});
