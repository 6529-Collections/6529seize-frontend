import React from "react";
import { render, act, waitFor, screen } from "@testing-library/react";
import GroupCreate from "@/components/groups/page/create/GroupCreate";
import { AuthContext } from "@/components/auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

let includeProps: any;
let nameProps: any;
let configProps: any;
let configWalletHistory: Array<string[] | null> = [];

jest.mock(
  "@/components/groups/page/create/GroupCreateWrapper",
  () => (props: any) => <div data-testid="wrapper">{props.children}</div>
);
jest.mock("@/components/groups/page/create/GroupCreateHeader", () => () => (
  <div data-testid="header" />
));
jest.mock(
  "@/components/groups/page/create/GroupCreateName",
  () => (props: any) => {
    nameProps = props;
    return <div data-testid="name" />;
  }
);
jest.mock(
  "@/components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMeAndPrivate",
  () => (props: any) => {
    includeProps = props;
    return <div data-testid="include" />;
  }
);
jest.mock(
  "@/components/groups/page/create/config/GroupCreateConfig",
  () => (props: any) => {
    configProps = props;
    configWalletHistory.push(props.wallets);
    return <div data-testid="config" />;
  }
);
jest.mock(
  "@/components/groups/page/create/actions/GroupCreateActions",
  () => () => <div data-testid="actions" />
);

const mockedUseQuery = useQuery as jest.Mock;

function renderComponent(ctx: any) {
  mockedUseQuery
    .mockReturnValueOnce({ isFetching: false, data: null })
    .mockReturnValueOnce({ isFetching: false, data: null });
  return render(
    <AuthContext.Provider value={ctx}>
      <GroupCreate edit="new" onCompleted={jest.fn()} />
    </AuthContext.Provider>
  );
}

describe("GroupCreate", () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    mockedUseQuery.mockReturnValue({
      isFetching: false,
      isError: false,
      data: null,
      refetch: jest.fn(),
    });
    includeProps = null;
    nameProps = null;
    configProps = null;
    configWalletHistory = [];
  });

  it("shows loading indicator until edit data is available", () => {
    mockedUseQuery
      .mockReturnValueOnce({
        isFetching: true,
        isError: false,
        data: undefined,
        refetch: jest.fn(),
      })
      .mockReturnValueOnce({
        isFetching: false,
        isError: false,
        data: undefined,
        refetch: jest.fn(),
      })
      .mockReturnValueOnce({
        isFetching: false,
        isError: false,
        data: undefined,
        refetch: jest.fn(),
      });
    render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreate edit="group-1" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading group...");
  });

  it("shows a retryable error when edit data cannot load", () => {
    const refetch = jest.fn();
    mockedUseQuery.mockReturnValueOnce({
      isFetching: false,
      isError: true,
      data: undefined,
      refetch,
    });

    render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreate edit="group-1" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load this group"
    );
    screen.getByRole("button", { name: "Retry" }).click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("allows including primary wallet", () => {
    const ctx = {
      connectedProfile: { primary_wallet: "0xA", wallets: [{ wallet: "0xA" }] },
    } as any;
    const { rerender } = renderComponent(ctx);
    expect(includeProps.iAmIncluded).toBe(false);
    act(() => {
      includeProps.setIAmIncluded(true);
    });
    rerender(
      <AuthContext.Provider value={ctx}>
        <GroupCreate edit="new" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );
    expect(includeProps.iAmIncluded).toBe(true);
  });

  it("tracks a primary wallet even when the profile wallet list is absent", () => {
    const ctx = {
      connectedProfile: { primary_wallet: "0xA" },
    } as any;
    renderComponent(ctx);

    act(() => includeProps.setIAmIncluded(true));
    expect(includeProps.iAmIncluded).toBe(true);

    act(() => includeProps.setIAmIncluded(false));
    expect(includeProps.iAmIncluded).toBe(false);
    expect(configProps.wallets).toEqual([]);
  });

  it("removes every connected wallet and source when Include me is turned off", () => {
    const ctx = {
      connectedProfile: {
        primary_wallet: "0xA",
        wallets: [{ wallet: "0xA" }, { wallet: "0xB" }],
      },
    } as any;
    renderComponent(ctx);

    act(() => {
      configProps.setIncludeWalletSources({
        uploadedWallets: ["0xB", "0xOther"],
        emmaWallets: ["0xA", "0xEmma"],
        selectedIdentities: [{ wallet: "0xB" }, { wallet: "0xSelected" }],
      });
      configProps.setWallets(["0xA", "0xB", "0xOther"]);
    });

    expect(includeProps.iAmIncluded).toBe(true);

    act(() => includeProps.setIAmIncluded(false));

    expect(configProps.wallets).toEqual(["0xOther"]);
    expect(configProps.includeWalletSources).toEqual({
      uploadedWallets: ["0xOther"],
      emmaWallets: ["0xEmma"],
      selectedIdentities: [{ wallet: "0xSelected" }],
    });
    expect(includeProps.iAmIncluded).toBe(false);
  });

  it("mounts edit wallet controls only after saved identities are initialized", async () => {
    const includedWallets = ["0x111", "0x222"];
    const excludedWallets = ["0x333"];
    const originalGroup = {
      id: "group-1",
      name: "Saved group",
      created_by: { handle: "alice" },
      group: {
        tdh: { min: null, max: null, inclusion_strategy: null },
        rep: {
          min: null,
          max: null,
          direction: null,
          user_identity: null,
          category: null,
        },
        cic: { min: null, max: null, direction: null, user_identity: null },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_id: "included",
        excluded_identity_group_id: "excluded",
        is_beneficiary_of_grant_id: null,
        is_beneficiary_of_grant_match_mode: null,
      },
      is_private: false,
    };

    mockedUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === QueryKey.GROUP) {
        return { isFetching: false, data: originalGroup };
      }
      const walletGroupId = queryKey[1]?.wallet_group_id;
      return {
        isFetching: false,
        data: walletGroupId === "included" ? includedWallets : excludedWallets,
      };
    });

    render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreate edit="group-1" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(configProps).not.toBeNull());
    expect(configWalletHistory).toEqual([includedWallets]);
    expect(configProps.excludeWallets).toEqual(excludedWallets);
  });

  it("preserves unsaved edits when a background query refresh fails", async () => {
    const originalGroup = {
      id: "group-1",
      name: "Saved group",
      created_by: { handle: "alice" },
      group: {
        tdh: { min: null, max: null, inclusion_strategy: null },
        rep: {
          min: null,
          max: null,
          direction: null,
          user_identity: null,
          category: null,
        },
        cic: { min: null, max: null, direction: null, user_identity: null },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_id: "included",
        excluded_identity_group_id: null,
        is_beneficiary_of_grant_id: null,
        is_beneficiary_of_grant_match_mode: null,
      },
      is_private: false,
    };
    let isError = false;

    mockedUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === QueryKey.GROUP) {
        return { isFetching: false, isError, data: originalGroup };
      }
      return { isFetching: false, isError, data: ["0x111"] };
    });

    const view = render(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreate edit="group-1" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(nameProps).not.toBeNull());
    act(() => nameProps.setName("Unsaved group name"));
    expect(nameProps.name).toBe("Unsaved group name");

    isError = true;
    view.rerender(
      <AuthContext.Provider value={{ connectedProfile: null } as any}>
        <GroupCreate edit="group-1" onCompleted={jest.fn()} />
      </AuthContext.Provider>
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(nameProps.name).toBe("Unsaved group name");
  });
});
