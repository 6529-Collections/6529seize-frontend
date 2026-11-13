import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { MintingClaimsRootItem } from "@/generated/models/MintingClaimsRootItem";
import { Time } from "@/helpers/time";
import { buildMemesPhases, useManifoldClaim } from "@/hooks/useManifoldClaim";
import { commonApiFetch } from "@/services/api/common-api";
import { createDeferredPromise } from "../utils/deferredPromise";

const reads = new Map<number, unknown>();
const refetch = jest.fn();
const rootHash = `0x${"1".repeat(64)}`;
const [phase0] = buildMemesPhases(Time.fromString("2024-07-03T00:00:00Z"));
if (!phase0) throw new Error("The mint schedule must contain Phase 0");
const phaseStart = phase0.start;
const phaseEnd = phase0.end;

jest.mock("wagmi", () => ({
  useReadContract: ({ args }: { args: [string, number] }) => ({
    data: reads.get(args[1]),
    error: null,
    isFetching: false,
    refetch,
  }),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const fetchRoots = jest.mocked(commonApiFetch);
const rootsForPhase = (phase: string): MintingClaimsRootItem[] => [
  { phase, merkle_root: rootHash, addresses_count: 2, total_spots: 3 },
];
function setRead(card: number) {
  reads.set(card, [
    BigInt(card),
    {
      startDate: BigInt(phaseStart.toSeconds()),
      endDate: BigInt(phaseEnd.toSeconds()),
      total: 1n,
      totalMax: 328n,
      merkleRoot: rootHash,
    },
  ]);
}
function Consumer({
  card,
  name,
  contract = MEMES_CONTRACT,
}: {
  readonly card: number;
  readonly name: string;
  readonly contract?: string;
}) {
  const { claim } = useManifoldClaim({
    chainId: 1,
    contract,
    proxy: "0x2",
    abi: [],
    identifier: card,
  });
  return (
    <output
      data-testid={name}
    >{`${claim?.identifier}:${claim?.memePhase?.id}`}</output>
  );
}

beforeEach(() => {
  reads.clear();
  fetchRoots.mockReset();
  refetch.mockClear();
  jest.spyOn(Date, "now").mockReturnValue(phaseStart.toMillis());
  setRead(573);
  setRead(574);
});
afterEach(() => jest.restoreAllMocks());

test("four independent consumers share one roots request and all receive its phase", async () => {
  const response = createDeferredPromise<MintingClaimsRootItem[]>();
  fetchRoots.mockReturnValue(response.promise);
  const { unmount } = render(
    <>
      <Consumer card={573} name="latest" />
      <Consumer card={573} name="coming-up" />
      <Consumer card={573} name="stats" />
      <Consumer card={573} name="countdown" />
    </>
  );
  try {
    expect(fetchRoots).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => response.resolve(rootsForPhase("Phase 1")));
  }
  for (const name of ["latest", "coming-up", "stats", "countdown"]) {
    await waitFor(() =>
      expect(screen.getByTestId(name)).toHaveTextContent("573:1")
    );
  }
  expect(refetch).not.toHaveBeenCalled();
  unmount();
});

test("a late response for the previous card cannot change the current card's phase", async () => {
  const oldResponse = createDeferredPromise<MintingClaimsRootItem[]>();
  const newResponse = createDeferredPromise<MintingClaimsRootItem[]>();
  fetchRoots.mockImplementation(({ endpoint }) =>
    endpoint.includes("/573/") ? oldResponse.promise : newResponse.promise
  );
  const { rerender, unmount } = render(
    <>
      <Consumer card={573} name="current" />
      <Consumer card={573} name="other-page" />
    </>
  );
  rerender(
    <>
      <Consumer card={574} name="current" />
      <Consumer card={573} name="other-page" />
    </>
  );
  try {
    expect(fetchRoots).toHaveBeenCalledTimes(2);
    await act(async () => newResponse.resolve(rootsForPhase("Phase 1")));
    await waitFor(() =>
      expect(screen.getByTestId("current")).toHaveTextContent("574:1")
    );
  } finally {
    await act(async () => {
      oldResponse.resolve(rootsForPhase("Phase 2"));
      newResponse.resolve(rootsForPhase("Phase 1"));
    });
  }
  await waitFor(() =>
    expect(screen.getByTestId("other-page")).toHaveTextContent("573:2")
  );
  expect(screen.getByTestId("current")).toHaveTextContent("574:1");
  unmount();
});

test("Strict Mode effect replay shares the request and still delivers its result", async () => {
  const response = createDeferredPromise<MintingClaimsRootItem[]>();
  fetchRoots.mockReturnValue(response.promise);
  const { unmount } = render(
    <StrictMode>
      <Consumer card={573} name="first" />
      <Consumer card={573} name="second" />
    </StrictMode>
  );
  try {
    expect(fetchRoots).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => response.resolve(rootsForPhase("Phase 1")));
  }
  for (const name of ["first", "second"]) {
    await waitFor(() =>
      expect(screen.getByTestId(name)).toHaveTextContent("573:1")
    );
  }
  unmount();
});

test("unmounting one consumer does not discard the result needed by another", async () => {
  const response = createDeferredPromise<MintingClaimsRootItem[]>();
  fetchRoots.mockReturnValue(response.promise);
  const { rerender, unmount } = render(
    <>
      <Consumer key="first" card={573} name="first" />
      <Consumer key="second" card={573} name="second" />
    </>
  );
  rerender(<Consumer key="second" card={573} name="second" />);
  await act(async () => response.resolve(rootsForPhase("Phase 1")));
  await waitFor(() =>
    expect(screen.getByTestId("second")).toHaveTextContent("573:1")
  );
  expect(fetchRoots).toHaveBeenCalledTimes(1);
  unmount();
});

test("a later consumer fetches fresh roots without changing existing consumers", async () => {
  fetchRoots.mockResolvedValueOnce(rootsForPhase("Phase 0"));
  const { rerender, unmount } = render(<Consumer card={573} name="first" />);
  await waitFor(() =>
    expect(screen.getByTestId("first")).toHaveTextContent("573:0")
  );
  fetchRoots.mockResolvedValueOnce(rootsForPhase("Phase 1"));
  rerender(
    <>
      <Consumer card={573} name="first" />
      <Consumer card={573} name="later" />
    </>
  );
  await waitFor(() =>
    expect(screen.getByTestId("later")).toHaveTextContent("573:1")
  );
  expect(screen.getByTestId("first")).toHaveTextContent("573:0");
  expect(fetchRoots).toHaveBeenCalledTimes(2);
  unmount();
});

test("a roots failure preserves the scheduled phase and does not stop live claim data", async () => {
  fetchRoots.mockRejectedValueOnce(new Error("roots offline"));
  const { unmount } = render(<Consumer card={573} name="current" />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.getByTestId("current")).toHaveTextContent("573:0");
  expect(refetch).not.toHaveBeenCalled();
  unmount();
});

test("unsupported contracts and missing card identifiers still make no roots request", () => {
  const { unmount } = render(
    <>
      <Consumer card={573} name="other-contract" contract="0x123" />
      <Consumer card={-1} name="missing" />
    </>
  );
  expect(fetchRoots).not.toHaveBeenCalled();
  unmount();
});
