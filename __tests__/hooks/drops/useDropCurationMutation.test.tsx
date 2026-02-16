import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  useDropCurationMutation,
  type DropCurationTarget,
} from "@/hooks/drops/useDropCurationMutation";
import {
  commonApiDelete,
  commonApiPostWithoutBodyAndResponse,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiPostWithoutBodyAndResponse: jest.fn(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(() => null),
}));

const mockedCommonApiDelete = commonApiDelete as jest.MockedFunction<
  typeof commonApiDelete
>;
const mockedCommonApiPost =
  commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
    typeof commonApiPostWithoutBodyAndResponse
  >;

const target: DropCurationTarget = {
  dropId: "drop-1",
  waveId: "wave-1",
  isCuratable: true,
  isCurated: false,
};

const createWrapper = ({
  invalidateDrops,
  setToast,
}: {
  invalidateDrops: jest.Mock;
  setToast: jest.Mock;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "alice" },
            setToast,
          } as any
        }
      >
        <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe("useDropCurationMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revalidates drop queries after successful curate", async () => {
    mockedCommonApiPost.mockResolvedValue(undefined);
    const invalidateDrops = jest.fn();
    const setToast = jest.fn();

    const { result } = renderHook(() => useDropCurationMutation(), {
      wrapper: createWrapper({ invalidateDrops, setToast }),
    });

    act(() => {
      result.current.toggleCuration(target);
    });

    await waitFor(() => {
      expect(mockedCommonApiPost).toHaveBeenCalledWith({
        endpoint: "drops/drop-1/curations",
      });
      expect(invalidateDrops).toHaveBeenCalledTimes(1);
    });
  });

  it("revalidates drop queries after successful uncurate", async () => {
    mockedCommonApiDelete.mockResolvedValue(undefined);
    const invalidateDrops = jest.fn();
    const setToast = jest.fn();

    const { result } = renderHook(() => useDropCurationMutation(), {
      wrapper: createWrapper({ invalidateDrops, setToast }),
    });

    act(() => {
      result.current.toggleCuration({ ...target, isCurated: true });
    });

    await waitFor(() => {
      expect(mockedCommonApiDelete).toHaveBeenCalledWith({
        endpoint: "drops/drop-1/curations",
      });
      expect(invalidateDrops).toHaveBeenCalledTimes(1);
    });
  });

  it("does not revalidate queries when curate mutation fails", async () => {
    mockedCommonApiPost.mockRejectedValue(new Error("boom"));
    const invalidateDrops = jest.fn();
    const setToast = jest.fn();

    const { result } = renderHook(() => useDropCurationMutation(), {
      wrapper: createWrapper({ invalidateDrops, setToast }),
    });

    act(() => {
      result.current.toggleCuration(target);
    });

    await waitFor(() => {
      expect(setToast).toHaveBeenCalledWith({
        message: "Failed to curate drop: boom",
        type: "error",
      });
    });
    expect(invalidateDrops).not.toHaveBeenCalled();
  });
});
