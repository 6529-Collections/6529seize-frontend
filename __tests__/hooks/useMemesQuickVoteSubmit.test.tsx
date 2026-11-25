import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { useChainWavesWriters } from "@/components/chain-waves/useChainWavesWriters";
import { isChainIdentityActive } from "@/lib/chain-identity/active";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { identityOfWallet } from "@/lib/chain-waves/signing";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@/components/chain-waves/useChainWavesWriters", () => ({
  useChainWavesWriters: jest.fn(() => null),
}));
jest.mock("@/lib/chain-identity/active", () => ({
  ...jest.requireActual("@/lib/chain-identity/active"),
  isChainIdentityActive: jest.fn(() => false),
}));
const post = jest.mocked(commonApiPost);
const drop = (id: string) =>
  ({
    id,
    context_profile_context: { rating: 0, min_rating: 0, max_rating: 1000 },
  }) as ExtendedDrop;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(requestAuth = jest.fn().mockResolvedValue({ success: true })) {
  const client = new QueryClient();
  const options = {
    requestAuth,
    onRatingFailure: jest.fn(),
    onRatingSuccess: jest.fn(),
    onRatingQueued: jest.fn(),
    setAndPersistRecentAmounts: jest.fn(),
    setToast: jest.fn(),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useMemesQuickVoteSubmit(options), { wrapper }),
    ...options,
  };
}

afterEach(() => jest.clearAllMocks());

it("does not send a queued vote if the voting runtime changes during authentication", async () => {
  const auth = deferred<{ success: boolean }>();
  const { result, unmount, onRatingSuccess, onRatingFailure } = setup(
    jest.fn(() => auth.promise)
  );
  await act(async () => {
    await result.current.submitVote(drop("first"), 100);
  });
  unmount();
  await act(async () => auth.resolve({ success: true }));
  expect(post).not.toHaveBeenCalled();
  expect(onRatingSuccess).not.toHaveBeenCalled();
  expect(onRatingFailure).not.toHaveBeenCalled();
});

it("settles an already-sent vote in its original scope without sending the remaining queue", async () => {
  const rating = deferred<ApiDrop>();
  post.mockReturnValue(rating.promise);
  const { result, unmount, onRatingSuccess, onRatingFailure } = setup();
  await act(async () => {
    await result.current.submitVote(drop("first"), 100);
    await result.current.submitSkip(drop("second"));
  });
  expect(post).toHaveBeenCalledTimes(1);
  unmount();
  await act(async () => rating.resolve({} as ApiDrop));
  expect(post).toHaveBeenCalledTimes(1);
  expect(onRatingSuccess).toHaveBeenCalledWith(drop("first"), 100, 900, "vote");
  expect(onRatingFailure).not.toHaveBeenCalled();
});

it("continues queued votes while the same runtime remains mounted", async () => {
  post.mockResolvedValue({} as ApiDrop);
  const { result, onRatingSuccess } = setup();
  await act(async () => {
    await result.current.submitVote(drop("first"), 100);
    await result.current.submitSkip(drop("second"));
  });
  expect(post).toHaveBeenCalledTimes(2);
  expect(onRatingSuccess).toHaveBeenCalledTimes(2);
  expect(result.current.pendingDropIds).toEqual([]);
});

it("keeps quiet when the wallet prompt is declined, and restores the drop", async () => {
  post.mockRejectedValue(
    Object.assign(new Error("User rejected the request."), { code: 4001 })
  );
  const { result, onRatingFailure, setToast } = setup();
  await act(async () => {
    await result.current.submitVote(drop("first"), 100);
  });
  expect(setToast).not.toHaveBeenCalled();
  expect(onRatingFailure).toHaveBeenCalledWith(
    drop("first"),
    100,
    "vote",
    "Nothing was sent."
  );
});

it("still says a refused vote failed", async () => {
  post.mockRejectedValue(new Error("refused"));
  const { result, onRatingFailure, setToast } = setup();
  await act(async () => {
    await result.current.submitVote(drop("first"), 100);
  });
  expect(setToast).toHaveBeenCalledWith(
    expect.objectContaining({ type: "error" })
  );
  expect(onRatingFailure).toHaveBeenCalled();
});

describe("a quick vote sent to the 6529 Network", () => {
  /** The vote stops where the chain writer looks up the wallet. */
  const voteWithoutIdentity = () => {
    jest.spyOn(chainGateway, "getIdentityByWallet").mockResolvedValue(null);
    return identityOfWallet(`0x${"12".repeat(20)}`).then(() => undefined);
  };
  const chainVote = (vote: () => Promise<void>) =>
    jest.mocked(useChainWavesWriters).mockReturnValue({
      vote: jest.fn(vote),
      pollBallot: jest.fn(),
      waveRating: jest.fn(),
    });

  afterEach(() => {
    jest.mocked(useChainWavesWriters).mockReturnValue(null);
    jest.mocked(isChainIdentityActive).mockReturnValue(false);
    jest.restoreAllMocks();
  });

  it("gives the network's reason under a title, not as a connection error", async () => {
    chainVote(voteWithoutIdentity);
    const { result, setToast, onRatingFailure } = setup();
    await act(async () => {
      await result.current.submitVote(drop("first"), 100);
    });
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      title: "Couldn't submit your vote.",
      description: "This wallet has no identity on the 6529 Network yet.",
    });
    expect(onRatingFailure).toHaveBeenCalledWith(
      drop("first"),
      100,
      "vote",
      "This wallet has no identity on the 6529 Network yet."
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("points to the identity page once it takes changes", async () => {
    jest.mocked(isChainIdentityActive).mockReturnValue(true);
    chainVote(voteWithoutIdentity);
    const { result, setToast } = setup();
    await act(async () => {
      await result.current.submitVote(drop("first"), 100);
    });
    const toast = setToast.mock.calls.at(-1)?.[0] as {
      readonly description: ReactNode;
    };
    render(<p data-testid="description">{toast.description}</p>);
    expect(screen.getByTestId("description")).toHaveTextContent(
      "This wallet has no identity on the 6529 Network yet. Set one up on your identity page."
    );
    expect(
      screen.getByRole("link", { name: "your identity page" })
    ).toHaveAttribute("href", "/network/identity");
  });
});
