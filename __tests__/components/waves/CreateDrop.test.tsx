import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DropMutationBody } from "@/components/waves/CreateDrop";
import CreateDrop from "@/components/waves/CreateDrop";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWave } from "@/hooks/useWave";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: any) => ({
    mutateAsync: jest.fn(async (variables: any) => {
      try {
        const result = await options.mutationFn(variables);
        options.onSuccess?.(result, variables, undefined);
        return result;
      } catch (error) {
        options.onError?.(error, variables, undefined);
        throw error;
      }
    }),
  }),
}));
jest.mock("@/hooks/useProgressiveDebounce", () => ({
  useProgressiveDebounce: (cb: any) => {
    setTimeout(cb, 0);
  },
}));
jest.mock("@/hooks/useWave", () => ({ useWave: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    processDropRemoved: jest.fn(),
    processIncomingDrop: jest.fn(),
  }),
}));
jest.mock("@/components/waves/CreateDropStormParts", () => () => (
  <div data-testid="storm" />
));
jest.mock("@/components/waves/CreateDropContent", () => (props: any) => (
  <button
    onClick={() =>
      props.submitDrop({
        drop: { wave_id: "1" },
        dropId: null,
      } as DropMutationBody)
    }
  >
    submit
  </button>
));
jest.mock("@/components/waves/CreateCurationDropContent", () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      onClick={() =>
        props.submitDrop({
          drop: { wave_id: "1" },
          dropId: null,
        } as DropMutationBody)
      }
    >
      submit curation
    </button>
  ),
}));

const useWaveMock = useWave as jest.MockedFunction<typeof useWave>;
const commonApiPostMock = commonApiPost as jest.Mock;

const wave = {
  id: "1",
  chat: { authenticated_user_eligible: true },
  participation: { authenticated_user_eligible: true },
} as any;

describe("CreateDrop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWaveMock.mockReturnValue({ isCurationWave: false } as any);
    commonApiPostMock.mockResolvedValue({ id: "server-drop", wave_id: "1" });
  });

  it("processes queued drop and calls mutation", async () => {
    const onDropAdded = jest.fn();
    const waitAndInvalidateDrops = jest.fn();
    render(
      <AuthContext.Provider value={{ setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider value={{ waitAndInvalidateDrops }}>
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={onDropAdded}
            wave={wave}
            dropId={null}
            fixedDropMode={"BOTH" as any}
            privileges={{} as any}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit"));

    await waitFor(() => expect(onDropAdded).toHaveBeenCalled());
    await waitFor(() => expect(waitAndInvalidateDrops).toHaveBeenCalled());
    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
  });

  it("shows success toast for leaderboard curation submissions", async () => {
    const setToast = jest.fn();
    useWaveMock.mockReturnValue({ isCurationWave: true } as any);

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
            curationComposerVariant="leaderboard"
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        message: "Drop submitted successfully",
        type: "success",
      });
    });
  });

  it("does not show success toast for non-leaderboard curation submissions", async () => {
    const setToast = jest.fn();
    useWaveMock.mockReturnValue({ isCurationWave: true } as any);

    render(
      <AuthContext.Provider value={{ setToast } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ waitAndInvalidateDrops: jest.fn() } as any}
        >
          <CreateDrop
            activeDrop={null}
            onCancelReplyQuote={() => {}}
            onDropAddedToQueue={jest.fn()}
            wave={wave}
            dropId={null}
            fixedDropMode={"PARTICIPATION" as any}
            privileges={{} as any}
            curationComposerVariant="default"
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByText("submit curation"));

    await waitFor(() => expect(commonApiPostMock).toHaveBeenCalled());
    expect(setToast).not.toHaveBeenCalledWith({
      message: "Drop submitted successfully",
      type: "success",
    });
  });
});
