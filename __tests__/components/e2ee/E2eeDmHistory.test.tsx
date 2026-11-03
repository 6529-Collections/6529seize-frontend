import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeDmHistory } from "@/components/e2ee/conversation/E2eeDmHistory";
import {
  ALICE_ID,
  conversation,
  createFakeE2eeEngine,
  member,
  SELF_ID,
} from "./fakeE2eeEngine";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
const dm = (g: string, status: "active" | "left") =>
  conversation({
    g,
    kind: "dm",
    admins: [SELF_ID, ALICE_ID],
    status,
    members:
      status === "active"
        ? [member(SELF_ID, "me"), member(ALICE_ID, "alice")]
        : [],
  });

beforeEach(() => jest.clearAllMocks());

it("keeps an old deep link readable and offers the current chat without creating another", () => {
  const old = dm("old", "left");
  const current = dm("current", "active");
  const engine = createFakeE2eeEngine();
  render(
    <E2eeDmHistory
      conversation={old}
      conversations={[old, current]}
      selfProfileId={SELF_ID}
      engine={engine}
    />
  );
  expect(screen.getByRole("combobox", { name: "Chat history" })).toHaveValue(
    "old"
  );
  expect(
    screen.getByRole("link", { name: "Open current chat" })
  ).toHaveAttribute("href", "/messages/encrypted/current");
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "current" },
  });
  expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/current");
  expect(engine.restart).not.toHaveBeenCalled();
});

it("continues an ended DM and reports a failed restart with a retry", async () => {
  const old = dm("old", "left");
  const engine = createFakeE2eeEngine();
  jest.mocked(engine.restart).mockRejectedValueOnce(new Error("network"));
  render(
    <E2eeDmHistory
      conversation={old}
      conversations={[old]}
      selfProfileId={SELF_ID}
      engine={engine}
    />
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Continue encrypted chat" })
  );
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Continue encrypted chat" })
  );
  await waitFor(() => expect(engine.restart).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(mockPush).toHaveBeenCalled());
});

it("adds no history control to an ordinary active DM or a group", () => {
  const current = dm("current", "active");
  const engine = createFakeE2eeEngine();
  const view = render(
    <E2eeDmHistory
      conversation={current}
      conversations={[current]}
      selfProfileId={SELF_ID}
      engine={engine}
    />
  );
  expect(view.container).toBeEmptyDOMElement();
  const group = conversation();
  view.rerender(
    <E2eeDmHistory
      conversation={group}
      conversations={[group]}
      selfProfileId={SELF_ID}
      engine={engine}
    />
  );
  expect(view.container).toBeEmptyDOMElement();
});
