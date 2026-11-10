import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import IdentityGettingStartedAboutAction from "@/components/user/identity/getting-started/IdentityGettingStartedAboutAction";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import UserPageHeaderAboutEdit from "@/components/user/user-page-header/about/UserPageHeaderAboutEdit";
import type { CicStatement } from "@/entities/IProfile";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => {
  return function Dialog({
    children,
    isOpen,
    title,
    onClose,
  }: {
    readonly children: ReactNode;
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
  }) {
    return isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null;
  };
});
jest.mock(
  "@/components/user/user-page-header/about/UserPageHeaderAboutEdit",
  () =>
    jest.fn(({ onClose }: { readonly onClose: () => void }) => (
      <button type="button" onClick={onClose}>
        Existing About editor
      </button>
    ))
);

const profile = Object.assign(new ApiIdentity(), {
  id: "alice-id",
  handle: " ALICE ",
  primary_wallet: "0xabc",
});

const about: CicStatement = {
  id: "about-id",
  profile_id: "alice-id",
  statement_group: STATEMENT_GROUP.GENERAL,
  statement_type: STATEMENT_TYPE.BIO,
  statement_value: "An existing introduction",
  statement_comment: null,
  crated_at: "2026-11-10T10:00:00Z",
};

const clients: QueryClient[] = [];
function renderAction(statements?: CicStatement[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  clients.push(client);
  if (statements) {
    client.setQueryData([QueryKey.PROFILE_CIC_STATEMENTS, "alice"], statements);
  }
  return render(
    <QueryClientProvider client={client}>
      <IdentityGettingStartedAboutAction profile={profile} />
    </QueryClientProvider>
  );
}

describe("IdentityGettingStartedAboutAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonApiFetch).mockResolvedValue([]);
  });
  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear());
  });

  it("reuses the profile statements cache and opens the existing editor", () => {
    renderAction([about]);
    fireEvent.click(
      screen.getByRole("button", { name: /Edit About statement/ })
    );

    expect(commonApiFetch).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Edit About" })
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Statements are optional and fully and permanently public."
    );
    expect(jest.mocked(UserPageHeaderAboutEdit).mock.lastCall?.[0]).toEqual(
      expect.objectContaining({ profile, statement: about, autoFocus: true })
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Existing About editor" })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not confuse unrelated statements with an existing About", () => {
    renderAction([
      {
        ...about,
        id: "wrong-group",
        statement_group: STATEMENT_GROUP.NFT_ACCOUNTS,
      },
      { ...about, id: "wrong-type", statement_type: "LINK" },
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: /Add an About statement/ })
    );
    expect(
      jest.mocked(UserPageHeaderAboutEdit).mock.lastCall?.[0].statement
    ).toBeNull();
  });

  it("waits for existing statements before allowing a new draft", async () => {
    let resolveStatements: (value: CicStatement[]) => void = () => undefined;
    jest.mocked(commonApiFetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStatements = resolve;
        })
    );
    renderAction();
    expect(
      screen.getByRole("button", { name: /Add an About statement/ })
    ).toBeDisabled();
    expect(UserPageHeaderAboutEdit).not.toHaveBeenCalled();

    resolveStatements([about]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Edit About statement/ })
      ).toBeEnabled()
    );
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "profiles/alice/cic/statements",
    });
  });

  it("offers retry instead of opening an empty editor after statements fail", async () => {
    let resolveRetry: (value: CicStatement[]) => void = () => undefined;
    const retryResponse = new Promise<CicStatement[]>((resolve) => {
      resolveRetry = resolve;
    });
    jest
      .mocked(commonApiFetch)
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockImplementationOnce(() => retryResponse);
    renderAction();
    const trigger = screen.getByRole("button", {
      name: /Add an About statement/,
    });
    await waitFor(() => expect(trigger).toBeEnabled());
    fireEvent.click(trigger);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load your About statement"
    );
    expect(UserPageHeaderAboutEdit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
    expect(UserPageHeaderAboutEdit).not.toHaveBeenCalled();
    resolveRetry([about]);
    await screen.findByRole("button", { name: "Existing About editor" });
    expect(
      jest.mocked(UserPageHeaderAboutEdit).mock.lastCall?.[0].statement
    ).toEqual(about);
  });

  it("allows editing known cached data when only a background refresh fails", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    client.setQueryData([QueryKey.PROFILE_CIC_STATEMENTS, "alice"], [about]);
    jest.mocked(commonApiFetch).mockRejectedValue(new Error("refresh failed"));
    render(
      <QueryClientProvider client={client}>
        <IdentityGettingStartedAboutAction profile={profile} />
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(
        client.getQueryState([QueryKey.PROFILE_CIC_STATEMENTS, "alice"])?.status
      ).toBe("error")
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Edit About statement/ })
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      jest.mocked(UserPageHeaderAboutEdit).mock.lastCall?.[0].statement
    ).toEqual(about);
  });
});
