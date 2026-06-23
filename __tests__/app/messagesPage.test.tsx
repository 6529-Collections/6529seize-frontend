import MessagesPage from "@/app/messages/page";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/messages/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="messages-page-client" />,
}));

describe("Messages page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects legacy message query routes to canonical message paths", async () => {
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      MessagesPage({
        searchParams: Promise.resolve({
          wave: "dm-wave-123",
          drop: "drop-1",
          divider: "7",
        }),
      } as any)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/messages/dm-wave-123?drop=drop-1&divider=7"
    );
  });

  it("renders messages page when no legacy wave query exists", async () => {
    const result = await MessagesPage({
      searchParams: Promise.resolve({ drop: "drop-1" }),
    } as any);

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
