import { render, screen, act, fireEvent } from "@testing-library/react";
import React from "react";
import WaveHeaderFollow from "@/components/waves/header/WaveHeaderFollow";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  commonApiPost,
  commonApiDeleteWithBody,
} from "@/services/api/common-api";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");
jest.mock("@/hooks/useWaveDiscoveryViewer", () => ({
  useWaveDiscoveryViewer: () => ({ key: "alice" }),
}));

const { QueryClient } = jest.requireActual<
  typeof import("@tanstack/react-query")
>("@tanstack/react-query");
const queryClient = new QueryClient();

(useMutation as jest.Mock).mockImplementation((opts) => ({
  mutateAsync: async () => {
    try {
      const r = await opts.mutationFn();
      opts.onSuccess?.(r);
    } catch (e) {
      opts.onError?.(e);
    } finally {
      opts.onSettled?.();
    }
  },
}));

describe("WaveHeaderFollow", () => {
  const baseAuth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  } as any;
  const rq = { onWaveFollowChange: jest.fn() } as any;
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    jest.mocked(useQueryClient).mockReturnValue(queryClient);
  });

  it("follows when not subscribed", async () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderFollow wave={{ id: "w", subscribed_actions: [] } as any} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });
    expect(commonApiPost).toHaveBeenCalled();
    expect(rq.onWaveFollowChange).toHaveBeenCalledWith({
      waveId: "w",
      following: true,
    });
    expect(
      queryClient.getQueryData([QueryKey.WAVE_SIDEBAR_MEMBERSHIP, "alice"])
    ).toEqual([]);
  });

  it("unfollows when already subscribed", async () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderFollow
            wave={{ id: "w", subscribed_actions: [1] } as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });
    expect(commonApiDeleteWithBody).toHaveBeenCalled();
    expect(rq.onWaveFollowChange).toHaveBeenCalledWith({
      waveId: "w",
      following: false,
    });
    expect(
      queryClient.getQueryData([QueryKey.WAVE_SIDEBAR_MEMBERSHIP, "alice"])
    ).toEqual(["w"]);
  });

  it("supports full-width header layout", () => {
    render(
      <AuthContext.Provider value={baseAuth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <WaveHeaderFollow
            wave={{ id: "w", subscribed_actions: [] } as any}
            fullWidth
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const button = screen.getByRole("button", { name: "Join" });
    expect(button).toHaveClass("tw-h-10", "tw-w-full", "tw-justify-center");
  });
});
