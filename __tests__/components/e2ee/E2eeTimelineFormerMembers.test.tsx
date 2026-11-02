import { render, screen, within } from "@testing-library/react";
import { E2eeConversationView } from "@/components/e2ee/conversation/E2eeConversationView";
import { commonApiFetch } from "@/services/api/common-api";
import {
  ALICE_ID,
  contextFor,
  conversation,
  createFakeE2eeEngine,
  E2eeTestProvider,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

/**
 * People who left or were removed are no longer conversation members, but
 * their notices and earlier messages must still name them (D109 8.6).
 */

Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/messages/encrypted/0x",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const CAROL_ID = "profile-carol";
const GONE_ID = "profile-gone";
const fetchMock = commonApiFetch as jest.Mock;

const timeline = [
  message({
    id: "c1",
    seq: 1,
    senderProfileId: CAROL_ID,
    text: "carol was here",
  }),
  message({
    id: "n1",
    seq: 2,
    kind: "notice",
    senderProfileId: SELF_ID,
    notice: {
      type: "removed",
      actorProfileId: SELF_ID,
      targetProfileIds: [CAROL_ID],
    },
  }),
  message({
    id: "n2",
    seq: 3,
    kind: "notice",
    senderProfileId: GONE_ID,
    notice: {
      type: "left",
      actorProfileId: GONE_ID,
      targetProfileIds: [GONE_ID],
    },
  }),
  message({
    id: "m2",
    seq: 4,
    senderProfileId: ALICE_ID,
    text: "still here",
    reactions: { "👀": [CAROL_ID] },
  }),
];

describe("E2EE timeline names for former members", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(({ endpoint }: { endpoint: string }) =>
      endpoint === `identities/${CAROL_ID}`
        ? Promise.resolve({
            id: CAROL_ID,
            handle: "carol",
            pfp: null,
            primary_wallet: "0xcarol",
            wallets: [],
          })
        : Promise.reject(new Error("not found"))
    );
  });

  it("names removed members in notices, messages and reactions", async () => {
    const convo = conversation();
    const engine = createFakeE2eeEngine({
      conversations: [convo],
      messages: { [convo.g]: timeline },
    });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeConversationView g={convo.g} />
      </E2eeTestProvider>
    );
    const log = screen.getByRole("list", { name: "Messages" });
    expect(await within(log).findByText("You removed carol")).toBeVisible();
    expect(within(log).getByText("carol", { exact: true })).toBeVisible();
    expect(
      within(log).getByRole("button", { name: "👀: 1. Reacted by carol" })
    ).toBeVisible();
    // An unresolvable profile keeps the generic fallback.
    expect(within(log).getByText("Unknown member left")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: `identities/${CAROL_ID}` })
    );
    // Current members are never looked up again.
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: `identities/${ALICE_ID}` })
    );
  });
});
