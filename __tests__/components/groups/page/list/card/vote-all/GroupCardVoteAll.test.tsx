import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react";
import GroupCardVoteAll from "@/components/groups/page/list/card/vote-all/GroupCardVoteAll";
import type GroupCardVoteAllInputs from "@/components/groups/page/list/card/vote-all/GroupCardVoteAllInputs";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useQuery, useMutation } from "@tanstack/react-query";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { CreditDirection } from "@/components/groups/page/list/card/GroupCard";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");
jest.mock(
  "@/components/mobile-wrapper-dialog/MobileWrapperDialog",
  () =>
    ({
      children,
      onClose,
      dismissible,
    }: {
      children: React.ReactNode;
      onClose: () => void;
      dismissible: boolean;
    }) => (
      <div role="dialog" data-dismissible={dismissible}>
        {children}
        <button onClick={onClose}>Dialog close</button>
      </div>
    )
);
jest.mock(
  "@/components/groups/page/list/card/utils/GroupCardActionStats",
  () => () => null
);
jest.mock(
  "@/components/groups/page/list/card/vote-all/GroupCardVoteAllInputs",
  () => (props: React.ComponentProps<typeof GroupCardVoteAllInputs>) => (
    <>
      <input
        aria-label="Amount"
        value={props.amountToAdd ?? ""}
        onChange={(e) => props.setAmountToAdd(Number(e.target.value))}
      />
      <button onClick={() => props.setCategory("Art")}>Choose category</button>
      <button
        onClick={() => props.setCreditDirection(CreditDirection.SUBTRACT)}
      >
        Subtract
      </button>
    </>
  )
);

describe("GroupCardVoteAll", () => {
  const mockUseQuery = jest.mocked(useQuery);
  const mockUseMutation = useMutation as jest.Mock;
  const mockFetch = jest.mocked(commonApiFetch);
  const mockPost = jest.mocked(commonApiPost);
  const setToast = jest.fn();
  const requestAuth = jest.fn();
  const onIdentityBulkRate = jest.fn();
  const onCancel = jest.fn();
  const renderForm = (
    matter: ApiRateMatter.Cic | ApiRateMatter.Rep = ApiRateMatter.Cic
  ) =>
    render(
      <AuthContext.Provider
        value={
          { setToast, requestAuth } as unknown as React.ContextType<
            typeof AuthContext
          >
        }
      >
        <ReactQueryWrapperContext.Provider
          value={
            { onIdentityBulkRate } as unknown as React.ContextType<
              typeof ReactQueryWrapperContext
            >
          }
        >
          <GroupCardVoteAll
            matter={matter}
            group={{ id: "g1" } as ApiGroupFull}
            viewerIdentityKey="profile:viewer-1"
            onCancel={onCancel}
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
  const enterAmount = () =>
    fireEvent.change(screen.getByRole("textbox", { name: "Amount" }), {
      target: { value: "3" },
    });
  const save = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Grant" }));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    requestAuth.mockResolvedValue({ success: true });
    mockUseQuery.mockReturnValue({
      data: { count: 2 },
      isFetching: false,
    } as ReturnType<typeof useQuery>);
    mockUseMutation.mockImplementation(({ mutationFn, onError }) => ({
      mutateAsync: async (body: unknown) => {
        try {
          return await mutationFn(body);
        } catch (error) {
          onError(error);
          throw error;
        }
      },
    }));
    mockFetch.mockResolvedValue({
      count: 2,
      next: null,
      data: [{ wallet: "0xABC" }, { wallet: "0xDEF" }],
    });
    mockPost.mockResolvedValue({});
  });

  it("preserves group and viewer scope and submits lowercase wallets", async () => {
    renderForm();
    enterAmount();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "COMMUNITY_MEMBERS_TOP",
          expect.objectContaining({
            groupId: "g1",
            viewerIdentityKey: "profile:viewer-1",
          }),
        ],
      })
    );
    await save();
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "community-members/top",
        params: expect.objectContaining({
          group_id: "g1",
          page: 1,
          page_size: 100,
        }),
      })
    );
    expect(mockPost).toHaveBeenCalledWith({
      endpoint: "ratings",
      body: {
        matter: ApiRateMatter.Cic,
        category: null,
        amount_to_add: 3,
        target_wallet_addresses: ["0xabc", "0xdef"],
      },
    });
    expect(setToast).toHaveBeenCalledWith({
      message: "NIC distributed.",
      type: "success",
    });
    expect(onIdentityBulkRate).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("distributes consecutive member pages in order", async () => {
    mockFetch
      .mockResolvedValueOnce({ count: 2, next: 2, data: [{ wallet: "0xABC" }] })
      .mockResolvedValueOnce({
        count: 2,
        next: null,
        data: [{ wallet: "0xDEF" }],
      });
    renderForm();
    enterAmount();
    await save();
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, group_id: "g1" }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, group_id: "g1" }),
      })
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        body: expect.objectContaining({ target_wallet_addresses: ["0xabc"] }),
      })
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        body: expect.objectContaining({ target_wallet_addresses: ["0xdef"] }),
      })
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("requires a REP category and preserves subtraction", async () => {
    renderForm(ApiRateMatter.Rep);
    enterAmount();
    expect(screen.getByRole("button", { name: "Grant" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Choose category" }));
    fireEvent.click(screen.getByRole("button", { name: "Subtract" }));
    await save();
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          matter: ApiRateMatter.Rep,
          category: "Art",
          amount_to_add: -3,
        }),
      })
    );
  });

  it("does not submit after an unsuccessful authentication", async () => {
    requestAuth.mockResolvedValue({ success: false });
    renderForm();
    enterAmount();
    await save();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("disables Grant for zero members", () => {
    mockUseQuery.mockReturnValue({
      data: { count: 0 },
      isFetching: false,
    } as ReturnType<typeof useQuery>);
    renderForm();
    enterAmount();
    expect(screen.getByRole("button", { name: "Grant" })).toBeDisabled();
  });

  it("keeps the dialog open and announces progress until all batches finish", async () => {
    let finishBatch: (value: unknown) => void = () => undefined;
    mockPost.mockReturnValue(
      new Promise((resolve) => {
        finishBatch = resolve;
      })
    );
    renderForm();
    enterAmount();
    await save();
    expect(screen.getByRole("status")).toHaveTextContent("NIC Progress");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-dismissible",
      "false"
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Dialog close" }));
    expect(onCancel).not.toHaveBeenCalled();
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    await act(async () => {
      finishBatch({});
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    const completedUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(completedUnload);
    expect(completedUnload.defaultPrevented).toBe(false);
  });

  it.each(["members", "ratings"])(
    "reports %s failure, refreshes affected data and closes",
    async (failure) => {
      if (failure === "members")
        mockFetch.mockRejectedValue(new Error("fetch failed"));
      else mockPost.mockRejectedValue(new Error("rate failed"));
      renderForm();
      enterAmount();
      await save();
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't update group ratings.",
          description: "Please try again.",
        })
      );
      expect(setToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
      expect(onIdentityBulkRate).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-dismissible",
        "true"
      );
    }
  );
});
