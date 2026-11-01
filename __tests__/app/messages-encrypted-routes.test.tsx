import { render, screen } from "@testing-library/react";
import EncryptedConversationPage from "@/app/messages/encrypted/[group]/page";
import EncryptedMessagesDevicesPage from "@/app/messages/encrypted/devices/page";
import NewEncryptedChatPage from "@/app/messages/encrypted/new/page";
import EncryptedMessagesPage from "@/app/messages/encrypted/page";
import { isE2eeEnabled } from "@/config/e2eeEnv";

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("@/components/e2ee/routes/E2eeMessagesRoute", () => ({
  __esModule: true,
  default: ({ view }: { readonly view: { kind: string; g?: string } }) => (
    <div data-testid="e2ee-route">
      {view.kind}:{view.g ?? ""}
    </div>
  ),
}));

const isE2eeEnabledMock = isE2eeEnabled as jest.Mock;
const GROUP = `0x${"c".repeat(64)}`;

describe("/messages/encrypted routes", () => {
  beforeEach(() => {
    isE2eeEnabledMock.mockReturnValue(true);
  });

  it.each([
    ["list", () => EncryptedMessagesPage()],
    ["new", () => NewEncryptedChatPage()],
    ["devices", () => EncryptedMessagesDevicesPage()],
  ])("404s the %s route when the flag is off", (_name, renderPage) => {
    isE2eeEnabledMock.mockReturnValue(false);
    expect(renderPage).toThrow("NEXT_NOT_FOUND");
  });

  it("404s a conversation when the flag is off", async () => {
    isE2eeEnabledMock.mockReturnValue(false);
    await expect(
      EncryptedConversationPage({ params: Promise.resolve({ group: GROUP }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the client-only views when the flag is on", () => {
    render(EncryptedMessagesPage());
    expect(screen.getByTestId("e2ee-route")).toHaveTextContent("list:");
  });

  it("accepts only 32-byte hex group handles", async () => {
    const page = await EncryptedConversationPage({
      params: Promise.resolve({
        group: GROUP.toUpperCase().replace("0X", "0x"),
      }),
    });
    render(page);
    expect(screen.getByTestId("e2ee-route")).toHaveTextContent(
      `conversation:${GROUP}`
    );
    await expect(
      EncryptedConversationPage({
        params: Promise.resolve({ group: "not-a-handle" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
