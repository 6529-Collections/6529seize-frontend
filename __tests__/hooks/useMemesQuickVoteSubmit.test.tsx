import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
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
