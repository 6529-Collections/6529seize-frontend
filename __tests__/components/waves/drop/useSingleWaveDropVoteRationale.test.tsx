import type { PropsWithChildren } from "react";
import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSingleWaveDropVoteRationale } from "@/components/waves/drop/useSingleWaveDropVoteRationale";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

const useAuthMock = jest.mocked(useAuth);
const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const commonApiPostMock = jest.mocked(commonApiPost);
const setToast = jest.fn();
const addOptimisticDrop = jest.fn().mockResolvedValue(undefined);

const drop = {
  id: "drop-1",
  wave: { id: "wave-1" },
  parts: [{ part_id: 7 }],
} as ApiDrop;

describe("useSingleWaveDropVoteRationale", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <ReactQueryWrapperContext.Provider
        value={
          { addOptimisticDrop } as React.ContextType<
            typeof ReactQueryWrapperContext
          >
        }
      >
        {children}
      </ReactQueryWrapperContext.Provider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    useAuthMock.mockReturnValue({ setToast } as ReturnType<typeof useAuth>);
    useSeizeConnectContextMock.mockReturnValue({
      address: "0x123",
      isSafeWallet: false,
    } as ReturnType<typeof useSeizeConnectContext>);
    commonApiPostMock.mockResolvedValue(drop);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("does not create a reply while Vote with reply is off", async () => {
    const { result } = renderHook(
      () =>
        useSingleWaveDropVoteRationale({
          drop,
          voteTotal: 5,
          voteChange: 5,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.submitRationaleReply(drop);
    });

    expect(commonApiPostMock).not.toHaveBeenCalled();
  });

  it("rejects an empty enabled rationale without creating a reply", async () => {
    const { result } = renderHook(
      () =>
        useSingleWaveDropVoteRationale({
          drop,
          voteTotal: 5,
          voteChange: 5,
        }),
      { wrapper }
    );

    act(() => {
      result.current.handlePostRationaleChange(true);
    });
    act(() => {
      result.current.handleRationaleTextChange("   ");
    });
    await act(async () => {
      await result.current.submitRationaleReply(drop);
    });

    expect(commonApiPostMock).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      title: "Vote saved, but couldn't post your rationale reply.",
      description: "Add rationale text and try posting the reply again.",
    });
  });

  it("posts the generated vote summary when explicitly enabled without edits", async () => {
    const { result } = renderHook(
      () =>
        useSingleWaveDropVoteRationale({
          drop,
          voteTotal: 5,
          voteChange: 5,
        }),
      { wrapper }
    );

    act(() => {
      result.current.handlePostRationaleChange(true);
    });
    await act(async () => {
      await result.current.submitRationaleReply(drop);
    });

    expect(commonApiPostMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          parts: [
            expect.objectContaining({
              content: "Vote rationale (+5 at time of posting):",
            }),
          ],
        }),
      })
    );
  });

  it("preserves the written reason when the generated vote prefix changes", () => {
    const { result, rerender } = renderHook(
      ({ voteTotal, voteChange }) =>
        useSingleWaveDropVoteRationale({
          drop,
          voteTotal,
          voteChange,
        }),
      {
        initialProps: { voteTotal: 5, voteChange: 5 },
        wrapper,
      }
    );

    act(() => {
      result.current.handleRationaleTextChange(
        `${result.current.rationaleText}A concrete reason`
      );
    });
    rerender({ voteTotal: 8, voteChange: 3 });

    expect(result.current.rationaleText).toBe(
      "Vote rationale (+8 total, +3 change at time of posting):\n\n" +
        "A concrete reason"
    );
    expect(result.current.shouldPostRationale).toBe(true);
  });

  it("creates a chat reply with the rationale and vote target", async () => {
    const { result } = renderHook(
      () =>
        useSingleWaveDropVoteRationale({
          drop,
          voteTotal: 5,
          voteChange: 5,
        }),
      { wrapper }
    );

    act(() => {
      result.current.handleRationaleTextChange(
        `${result.current.rationaleText}A concrete reason`
      );
    });
    await act(async () => {
      await result.current.submitRationaleReply(drop);
    });

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "drops",
      body: {
        wave_id: "wave-1",
        reply_to: { drop_id: "drop-1", drop_part_id: 7 },
        drop_type: ApiDropType.Chat,
        title: null,
        parts: [
          {
            content:
              "Vote rationale (+5 at time of posting):\n\nA concrete reason",
            quoted_drop: null,
            media: [],
          },
        ],
        referenced_nfts: [],
        mentioned_users: [],
        mentioned_waves: [],
        mentioned_groups: [],
        metadata: [],
        signature: null,
        is_safe_signature: false,
        signer_address: "0x123",
      },
    });
    expect(addOptimisticDrop).toHaveBeenCalledWith({ drop });
  });
});
