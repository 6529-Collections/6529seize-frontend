import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery } from "@tanstack/react-query";
import { renderWithAuth } from "@/__tests__/utils/testContexts";
import MemeSubscriptionRow from "@/components/user/subscriptions/MemeSubscriptionRow";
import UserPageSubscriptionsEditionPreference from "@/components/user/subscriptions/UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsMode from "@/components/user/subscriptions/UserPageSubscriptionsMode";
import { publicEnv } from "@/config/env";
import { readUsableDeviceGrant } from "@/lib/device-signing/device-key-store";
import { fetchRecordAnchor } from "@/lib/signed-records/record-anchor";
import {
  encodeSignedRecordsHeader,
  type SignedRecordEvent,
} from "@/lib/signed-records/record-event";
import { signRecords } from "@/lib/signed-records/sign-records";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { getWalletAddress } from "@/services/auth/auth.utils";

// The flag is read when a change is sent; other modules read the rest of
// the public env when they load.
jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});
jest.mock("@/services/auth/auth.utils", () => ({
  ...jest.requireActual("@/services/auth/auth.utils"),
  getWalletAddress: jest.fn(),
}));
jest.mock("@/lib/device-signing/device-key-store", () => ({
  ...jest.requireActual("@/lib/device-signing/device-key-store"),
  readUsableDeviceGrant: jest.fn(),
}));
jest.mock("@/lib/signed-records/record-anchor", () => ({
  fetchRecordAnchor: jest.fn(),
}));
jest.mock("@/lib/signed-records/sign-records", () => ({
  ...jest.requireActual("@/lib/signed-records/sign-records"),
  signRecords: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiPost: jest.fn(),
  commonApiFetch: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

/*
 * The four subscription controls with NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS
 * on: each signs its change with the device key (signer and anchor mocked)
 * and sends it in the x-6529-signed-records header, and words the two
 * signing outcomes: try again, or turn on signing.
 */

const env = publicEnv as { NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS?: string };
const post = jest.mocked(commonApiPost);
const sign = jest.mocked(signRecords);

const WALLET = "0x00000000000000000000000000000000000000c1";
const PRINCIPAL = `0x${"c1".padStart(64, "0")}`;
const CONTRACT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const EVENT = { id: `0x${"e".repeat(64)}` } as SignedRecordEvent;
const SIGNED_HEADERS = {
  "x-6529-signed-records": encodeSignedRecordsHeader([EVENT]),
};
const details = {
  automatic: false,
  consolidation_key: "p1",
  last_update: 0,
  balance: 1,
  subscribe_all_editions: false,
  subscription_eligibility_count: 3,
};

const REQUIRED_TOAST = {
  type: "error",
  title: "Subscription changes are signed now.",
  description:
    "Turn on signed posts in this browser, then make the change again.",
  action: { label: "Turn on signed posts", href: "/preferences?tab=devices" },
};
const FAILED_TOAST = {
  type: "error",
  title: "Couldn't sign this change.",
  description: "Nothing was changed. Try again in a moment.",
};

function apiError(status: number, code: string) {
  return Object.assign(new Error("refused"), {
    name: "ApiError",
    status,
    response: { status, body: JSON.stringify({ error: "refused", code }) },
  });
}

function auth() {
  return {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
  };
}

function row(subscribed: boolean) {
  const context = auth();
  renderWithAuth(
    <MemeSubscriptionRow
      profileKey="p1"
      title="The Memes"
      subscription={{
        consolidation_key: "p1",
        contract: CONTRACT,
        token_id: 581,
        subscribed,
        subscribed_count: 1,
      }}
      eligibilityCount={3}
      readonly={false}
      refresh={jest.fn()}
      minting_today={false}
      first={false}
      date={null}
    />,
    context
  );
  return context;
}

beforeEach(() => {
  jest.clearAllMocks();
  env.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS = "true";
  jest.mocked(useQuery).mockReturnValue({ data: null } as never);
  jest.mocked(getWalletAddress).mockReturnValue(WALLET);
  jest.mocked(readUsableDeviceGrant).mockResolvedValue({} as never);
  // GET /signed-records/owners: the owner and the height it was read at.
  jest.mocked(commonApiFetch).mockResolvedValue({
    anchor: 1000,
    owners: [{ wallet: WALLET, owner: PRINCIPAL }],
  });
  jest.mocked(fetchRecordAnchor).mockResolvedValue({
    anchor: 1010,
    finalizedTime: 0,
    maxAnchorLag: 120,
  });
  sign.mockResolvedValue({ status: "signed", events: [EVENT], grantId: "g" });
});

afterAll(() => {
  delete env.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS;
});

describe("signed subscription changes in the controls", () => {
  it("signs the mode and sends it in the header", async () => {
    const context = auth();
    post.mockResolvedValueOnce({ automatic: true });
    renderWithAuth(
      <UserPageSubscriptionsMode
        profileKey="p1"
        details={details}
        readonly={false}
        refresh={jest.fn()}
      />,
      context
    );
    await userEvent.click(
      screen.getByRole("switch", { name: "Automatic subscription mode" })
    );
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      )
    );
    expect(sign).toHaveBeenCalledWith(
      [
        {
          kind: 9,
          wave: `ps/${PRINCIPAL}`,
          refs: ["subs.mode"],
          body: { automatic: true },
        },
      ],
      { anchor: 1000 }
    );
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/p1/subscription-mode",
      body: { automatic: true },
      headers: SIGNED_HEADERS,
      errorMode: "structured",
    });
  });

  it("offers to turn on signing when an unsigned mode change needs a signature", async () => {
    const context = auth();
    jest.mocked(readUsableDeviceGrant).mockResolvedValue(null);
    post.mockRejectedValueOnce(apiError(409, "SIGNED_RECORD_REQUIRED"));
    renderWithAuth(
      <UserPageSubscriptionsMode
        profileKey="p1"
        details={details}
        readonly={false}
        refresh={jest.fn()}
      />,
      context
    );
    await userEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(REQUIRED_TOAST)
    );
    expect(sign).not.toHaveBeenCalled();
    expect(post.mock.calls[0]![0]).not.toHaveProperty("headers");
  });

  it("sends the edition preference unsigned when signing fails, and asks to try again if the API needs a signature", async () => {
    const context = auth();
    sign.mockResolvedValueOnce({ status: "failed", reason: "timeout" });
    post.mockRejectedValueOnce(apiError(409, "SIGNED_RECORD_REQUIRED"));
    renderWithAuth(
      <UserPageSubscriptionsEditionPreference
        profileKey="p1"
        details={details}
        readonly={false}
        refresh={jest.fn()}
      />,
      context
    );
    await userEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(FAILED_TOAST)
    );
    expect(sign.mock.calls[0]![0]).toEqual([
      {
        kind: 9,
        wave: `ps/${PRINCIPAL}`,
        refs: ["subs.all-editions"],
        body: { all: true },
      },
    ]);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]![0]).not.toHaveProperty("headers");
  });

  it("signs a card's subscription keyed by contract and token", async () => {
    const context = row(false);
    post.mockResolvedValueOnce({ subscribed: true, token_id: 581 });
    await userEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      )
    );
    expect(sign.mock.calls[0]![0]).toEqual([
      {
        kind: 9,
        wave: `ps/${PRINCIPAL}`,
        refs: ["subs.card", `${CONTRACT}:581`],
        body: { subscribed: true },
      },
    ]);
    expect(post).toHaveBeenCalledWith({
      endpoint: "subscriptions/p1/subscription",
      body: { contract: CONTRACT, token_id: 581, subscribed: true },
      headers: SIGNED_HEADERS,
      errorMode: "structured",
    });
  });

  it("saves a count unsigned while the owner lookup is down, before the switch", async () => {
    const context = row(true);
    jest
      .mocked(commonApiFetch)
      .mockRejectedValueOnce(new Error("ANCHOR_UNAVAILABLE"));
    post.mockResolvedValueOnce({ count: 2 });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      )
    );
    expect(sign).not.toHaveBeenCalled();
    expect(post.mock.calls[0]![0]).not.toHaveProperty("headers");
    expect(screen.getByRole("combobox")).toHaveValue("2");
  });

  it("keeps the saved count and asks to try again when the lookup is down after the switch", async () => {
    const context = row(true);
    jest
      .mocked(commonApiFetch)
      .mockRejectedValueOnce(new Error("ANCHOR_UNAVAILABLE"));
    post.mockRejectedValueOnce(apiError(409, "SIGNED_RECORD_REQUIRED"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(FAILED_TOAST)
    );
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("1"));
  });

  it("signs a count, and keeps the control's own toast for the API's other refusals", async () => {
    const context = row(true);
    post.mockRejectedValueOnce(apiError(400, "OVER_ELIGIBILITY"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    await waitFor(() =>
      expect(context.setToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Couldn't update subscription count.",
        })
      )
    );
    expect(sign.mock.calls[0]![0]).toEqual([
      {
        kind: 9,
        wave: `ps/${PRINCIPAL}`,
        refs: ["subs.count", `${CONTRACT}:581`],
        body: { count: 3 },
      },
    ]);
  });
});
