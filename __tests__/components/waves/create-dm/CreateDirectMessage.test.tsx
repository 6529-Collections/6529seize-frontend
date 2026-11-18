import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateDirectMessage from "@/components/waves/create-dm/CreateDirectMessage";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { LEGACY_DM_DELETION_AT } from "@/components/e2ee/legacy/legacyDmRetention";
import {
  contextFor,
  createFakeE2eeEngine,
  E2eeTestProvider,
} from "../../e2ee/fakeE2eeEngine";

const mockPush = jest.fn();
const mockToast = jest.fn();
jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn(() => false) }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: mockToast }),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: () => ({ isVisible: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: {} }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { PROFILE_SEARCH: "PROFILE_SEARCH" },
}));
jest.mock("@/services/api/common-api", () => {
  const actual = jest.requireActual("@/services/api/common-api");
  return {
    commonApiFetch: jest.fn(),
    getStructuredApiErrorBody: actual.getStructuredApiErrorBody,
    getStructuredApiErrorCode: actual.getStructuredApiErrorCode,
  };
});
jest.mock("@/helpers/waves/waves.helpers", () => ({
  createDirectMessageWave: jest.fn(),
}));

function person(
  handle: string,
  wallet: string,
  overrides: Partial<CommunityMemberMinimal> = {}
): CommunityMemberMinimal {
  return {
    handle,
    wallet,
    primary_wallet: wallet,
    profile_id: wallet,
    normalised_handle: handle,
    display: handle,
    tdh: 20200,
    level: 10,
    cic_rating: 0,
    pfp: null,
    ...overrides,
  };
}
const alice = person("alice", "0xABC");
const bob = person("bob", "0xDEF", { tdh: 0 });
const self = person("myself", "0x111");

function setup() {
  const onBack = jest.fn();
  const onSuccess = jest.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={client}>
      <CreateDirectMessage
        profile={{ primary_wallet: self.wallet } as ApiIdentity}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );
  return {
    onBack,
    onSuccess,
    input: screen.getByRole("textbox", { name: "To:" }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isE2eeEnabled).mockReturnValue(false);
  jest.mocked(commonApiFetch).mockResolvedValue([alice, bob, self]);
  jest
    .mocked(createDirectMessageWave)
    .mockResolvedValue({ id: "dm-1" } as Awaited<
      ReturnType<typeof createDirectMessageWave>
    >);
});

it("keeps the chosen recipient in the unified composer when they need an unencrypted DM", async () => {
  const now = jest
    .spyOn(Date, "now")
    .mockReturnValue(Date.parse(LEGACY_DM_DELETION_AT) - 60_000);
  try {
    jest.mocked(isE2eeEnabled).mockReturnValue(true);
    const engine = createFakeE2eeEngine();
    jest
      .mocked(engine.checkEligibility)
      .mockResolvedValue([{ profileId: "0xABC", status: "NO_DEVICES" }]);
    const context = contextFor(engine);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(
      <E2eeTestProvider value={context}>
        <QueryClientProvider client={client}>
          <CreateDirectMessage
            profile={{ primary_wallet: self.wallet } as ApiIdentity}
            onBack={jest.fn()}
          />
        </QueryClientProvider>
      </E2eeTestProvider>
    );
    expect(screen.getByRole("heading", { name: "New message" })).toBeVisible();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/messages"
    );
    const input = screen.getByRole("textbox", { name: "To:" });
    fireEvent.change(input, { target: { value: "ali" } });
    fireEvent.click(await screen.findByRole("button", { name: /alice Level/ }));
    expect(engine.checkEligibility).toHaveBeenCalledWith(["0xABC"]);
    expect(screen.getByRole("button", { name: "Remove alice" })).toBeVisible();
    expect(
      await screen.findByText("Hasn’t turned on encrypted messages yet")
    ).toBeVisible();
    expect(screen.getByText(/deletes it from its servers/)).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
    const fallback = screen.getByRole("button", {
      name: "Continue unencrypted",
    });
    jest
      .mocked(createDirectMessageWave)
      .mockRejectedValueOnce(new Error("Request failed"));
    fireEvent.click(fallback);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Request failed"
    );
    expect(mockToast).not.toHaveBeenCalled();
    expect(fallback).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remove alice" })).toBeVisible();

    fireEvent.click(fallback);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/messages/dm-1")
    );
    expect(createDirectMessageWave).toHaveBeenCalledWith({
      addresses: ["0xabc"],
    });
    expect(fallback).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    now.mockRestore();
  }
});

it("keeps results after blur, toggles recipients, and removes the last chip with Backspace", async () => {
  const user = userEvent.setup();
  const { input } = setup();
  expect(screen.getByRole("button", { name: "Message" })).toBeDisabled();
  await user.type(input, "al");
  expect(commonApiFetch).not.toHaveBeenCalled();
  await user.type(input, "i");
  const row = await screen.findByRole("button", { name: /alice Level/ });
  fireEvent.blur(input);
  expect(row).toBeVisible();
  await user.click(row);
  expect(input).toHaveValue("ali");
  expect(row).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Message alice" })).toBeEnabled();
  await user.click(row);
  expect(row).toHaveAttribute("aria-pressed", "false");
  await user.click(row);
  await user.click(screen.getByRole("button", { name: "bob Level 10" }));
  expect(
    screen.getByRole("button", { name: "Message 2 people" })
  ).toBeEnabled();
  await user.clear(input);
  await user.keyboard("{Backspace}");
  expect(
    screen.queryByRole("button", { name: "Remove bob" })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove alice" }));
  expect(input).toHaveFocus();
  expect(screen.getByRole("button", { name: "Message" })).toBeDisabled();
});

it("preserves self-selection feedback, ranked search, group creation and navigation", async () => {
  const user = userEvent.setup();
  const { input, onSuccess } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /myself Level/ }));
  expect(mockToast).toHaveBeenCalledWith({
    message: "You are already included in this direct message.",
    type: "info",
  });
  expect(commonApiFetch).toHaveBeenLastCalledWith(
    expect.objectContaining({
      endpoint: "community-members",
      params: { param: "ali", only_profile_owners: "true", sort: "level" },
    })
  );
  await user.click(screen.getByRole("button", { name: /alice Level/ }));
  await user.click(screen.getByRole("button", { name: "bob Level 10" }));
  await user.click(screen.getByRole("button", { name: "Message 2 people" }));
  expect(createDirectMessageWave).toHaveBeenCalledWith({
    addresses: [alice.wallet, bob.wallet],
  });
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith("/messages/dm-1");
});

it("treats wallet aliases and case variants as the same selected recipient", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue([
      alice,
      person("alice-alias", "0x222", { primary_wallet: "0xabc" }),
    ]);
  const user = userEvent.setup();
  const { input } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /alice Level/ }));
  const alias = screen.getByRole("button", { name: /alice-alias Level/ });
  expect(alias).toHaveAttribute("aria-pressed", "true");
  await user.click(alias);
  expect(screen.getByRole("button", { name: "Message" })).toBeDisabled();
});

it("keeps recipients on creation failure and allows retry", async () => {
  jest
    .mocked(createDirectMessageWave)
    .mockRejectedValueOnce(new Error("Recipient does not accept new messages"));
  const user = userEvent.setup();
  const { input } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /alice Level/ }));
  await user.click(screen.getByRole("button", { name: "Message alice" }));
  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't create this direct message.",
      })
    )
  );
  expect(screen.getByRole("button", { name: "Remove alice" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Message alice" }));
  expect(mockPush).toHaveBeenCalledWith("/messages/dm-1");
});

it("explains a refused recipient with localized copy from the error code", async () => {
  const refusal = Object.assign(new Error("server copy"), {
    status: 403,
    response: {
      status: 403,
      body: JSON.stringify({
        error: "server copy",
        code: "DM_RECIPIENT_GROUP_MEMBERS_ONLY",
        handle: "alice",
      }),
    },
  });
  jest.mocked(createDirectMessageWave).mockRejectedValueOnce(refusal);
  const user = userEvent.setup();
  const { input } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /alice Level/ }));
  await user.click(screen.getByRole("button", { name: "Message alice" }));

  await waitFor(() =>
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        description:
          "@alice only accepts new direct messages from members of a group they chose.",
      })
    )
  );
});

it("prevents duplicate creation and locks recipient editing while submitting", async () => {
  let finish:
    | ((wave: Awaited<ReturnType<typeof createDirectMessageWave>>) => void)
    | undefined;
  jest.mocked(createDirectMessageWave).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const user = userEvent.setup();
  const { input } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /alice Level/ }));
  await user.click(screen.getByRole("button", { name: "Message alice" }));
  expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
  expect(input).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove alice" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("form", { name: "New message" }));
  expect(createDirectMessageWave).toHaveBeenCalledTimes(1);
  finish?.({ id: "dm-1" } as Awaited<
    ReturnType<typeof createDirectMessageWave>
  >);
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/messages/dm-1"));
});

it("shows empty and failed search states with retry", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce([])
    .mockRejectedValueOnce(new Error("Unavailable"))
    .mockResolvedValue([alice]);
  const user = userEvent.setup();
  const { input } = setup();
  const status = screen.getByRole("status");
  await user.type(input, "zzz");
  expect(
    await screen.findByText("No one found for “zzz”", { selector: "p" })
  ).toBeVisible();
  expect(status).toHaveTextContent("No one found for “zzz”");
  await user.type(input, "z");
  await waitFor(() =>
    expect(status).toHaveTextContent("Couldn't search for people.")
  );
  await user.click(screen.getByRole("button", { name: "Retry search" }));
  expect(
    await screen.findByRole("button", { name: /alice Level/ })
  ).toBeVisible();
  expect(status).toBe(screen.getByRole("status"));
  expect(status).toHaveTextContent("People found: 1");
});

it("preserves page back and Escape handling without submitting from the search input", async () => {
  const user = userEvent.setup();
  const { input, onBack } = setup();
  await user.type(input, "ali");
  await user.click(await screen.findByRole("button", { name: /alice Level/ }));
  await user.click(input);
  await user.keyboard("{Enter}{Escape}");
  expect(createDirectMessageWave).not.toHaveBeenCalled();
  expect(onBack).not.toHaveBeenCalled();
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(onBack).toHaveBeenCalledTimes(1);
  await user.click(
    screen.getByRole("button", { name: "Back to direct message list" })
  );
  expect(onBack).toHaveBeenCalledTimes(2);
});
