import { render, screen } from "@testing-library/react";
import { E2eeConversationIntro } from "@/components/e2ee/conversation/E2eeConversationIntro";
import { conversation, DM_G, member, SELF_ID } from "./fakeE2eeEngine";

describe("E2eeConversationIntro", () => {
  it("introduces a DM honestly and invites the first message", () => {
    render(
      <E2eeConversationIntro
        conversation={conversation({
          g: DM_G,
          kind: "dm",
          name: null,
          members: [member(SELF_ID, "me"), member("profile-bob", "bob")],
        })}
        selfProfileId={SELF_ID}
        empty
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "bob" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Messages in this chat are end-to-end encrypted. Only the people in it can read them."
      )
    ).toBeVisible();
    expect(
      screen.getByText(
        /This device shows messages from when it joined the chat/u
      )
    ).toBeVisible();
    expect(screen.getByText("No messages yet. Say hello.")).toBeVisible();
  });

  it("titles a group by name and drops the invitation once messages exist", () => {
    render(
      <E2eeConversationIntro
        conversation={conversation()}
        selfProfileId={SELF_ID}
        empty={false}
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Collectors" })
    ).toBeVisible();
    expect(screen.queryByText("No messages yet. Say hello.")).toBeNull();
  });
});
