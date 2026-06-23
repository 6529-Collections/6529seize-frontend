import MessageWavePage from "@/app/messages/[wave]/page";
import { redirect } from "next/navigation";
import {
  fetchWaveContext,
  isApiWaveDirectMessage,
} from "@/app/waves/waves-page.shared";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/messages/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="messages-page-client" />,
}));

jest.mock("@/app/waves/waves-page.shared", () => ({
  fetchWaveContext: jest.fn(),
  isApiWaveDirectMessage: jest.fn(),
}));

describe("Message wave page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects non-DM waves to the waves route", async () => {
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    (fetchWaveContext as jest.Mock).mockResolvedValue({
      wave: { id: "wave-123" },
    });
    (isApiWaveDirectMessage as jest.Mock).mockReturnValue(false);

    await expect(
      MessageWavePage({
        params: Promise.resolve({ wave: "wave-123" }),
        searchParams: Promise.resolve({ drop: "drop-1", divider: "7" }),
      } as any)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/waves/wave-123?drop=drop-1&divider=7"
    );
  });

  it("renders message content for DM waves", async () => {
    (fetchWaveContext as jest.Mock).mockResolvedValue({
      wave: { id: "dm-123" },
    });
    (isApiWaveDirectMessage as jest.Mock).mockReturnValue(true);

    const result = await MessageWavePage({
      params: Promise.resolve({ wave: "dm-123" }),
      searchParams: Promise.resolve({}),
    } as any);

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
