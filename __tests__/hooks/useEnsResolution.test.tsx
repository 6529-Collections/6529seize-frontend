import { act, renderHook, waitFor } from "@testing-library/react";
import { useEnsResolution } from "@/hooks/useEnsResolution";

const mockUseEnsName = jest.fn();
const mockUseEnsAddress = jest.fn();

jest.mock("wagmi", () => ({
  useEnsName: (...args: unknown[]) => mockUseEnsName(...args),
  useEnsAddress: (...args: unknown[]) => mockUseEnsAddress(...args),
}));

describe("useEnsResolution", () => {
  const address = "0x78fb3d569650ea743fb7876312cb5ff7505dd602";
  const secondAddress = "0x0000000000000000000000000000000000000001";

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnsName.mockReturnValue({ data: null });
    mockUseEnsAddress.mockReturnValue({ data: null });
  });

  it("exposes the trailing address when initialValue is an ENS display label", () => {
    const { result } = renderHook(() =>
      useEnsResolution({ initialValue: `0wl.eth - ${address}` })
    );

    expect(result.current.inputValue).toBe(`0wl.eth - ${address}`);
    expect(result.current.address).toBe(address);
  });

  it("keeps the canonical address when reverse ENS resolution adds a display label", async () => {
    mockUseEnsName.mockReturnValue({ data: "0wl.eth" });

    const { result } = renderHook(() =>
      useEnsResolution({ initialValue: address })
    );

    await waitFor(() => {
      expect(result.current.inputValue).toBe(`0wl.eth - ${address}`);
    });
    expect(result.current.address).toBe(address);
  });

  it("preserves the ENS display label when the parent syncs the same raw address", async () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useEnsResolution({ initialValue }),
      { initialProps: { initialValue: `0wl.eth - ${address}` } }
    );

    expect(result.current.inputValue).toBe(`0wl.eth - ${address}`);

    rerender({ initialValue: address });

    await waitFor(() => {
      expect(result.current.inputValue).toBe(`0wl.eth - ${address}`);
      expect(result.current.address).toBe(address);
    });
  });

  it("syncs repeated initialValue changes without stale resolved addresses", () => {
    mockUseEnsAddress.mockImplementation(({ name }) => ({
      data: name === "night0wl.eth" ? secondAddress : null,
    }));

    const { result, rerender } = renderHook(
      ({ initialValue }) => useEnsResolution({ initialValue }),
      { initialProps: { initialValue: address } }
    );

    expect(result.current.inputValue).toBe(address);
    expect(result.current.address).toBe(address);

    rerender({ initialValue: secondAddress });

    expect(result.current.inputValue).toBe(secondAddress);
    expect(result.current.address).toBe(secondAddress);

    rerender({ initialValue: "night0wl.eth" });

    expect(result.current.inputValue).toBe(`night0wl.eth - ${secondAddress}`);
    expect(result.current.address).toBe(secondAddress);
  });

  it("lets a new initialValue replace an imperative address override", () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useEnsResolution({ initialValue }),
      { initialProps: { initialValue: address } }
    );

    act(() => {
      result.current.setAddress(secondAddress);
    });

    expect(result.current.inputValue).toBe(address);
    expect(result.current.address).toBe(secondAddress);

    rerender({ initialValue: `0wl.eth - ${address}` });

    expect(result.current.inputValue).toBe(`0wl.eth - ${address}`);
    expect(result.current.address).toBe(address);
  });
});
