import DropSignatureDialog from "@/components/waves/drops/signature/DropSignatureDialog";
import DropSignatureMenuItem from "@/components/waves/drops/signature/DropSignatureMenuItem";
import type { DropSignatureVerdict } from "@/lib/device-signing/verify-signed-events";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockFetchSignedEvents = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDropSignedEvents: (...args: unknown[]) => mockFetchSignedEvents(...args),
}));

jest.mock("wagmi", () => ({
  usePublicClient: () => undefined,
}));

const mockVerify = jest.fn();
jest.mock("@/lib/device-signing/verify-signed-events", () => ({
  verifyDropSignedEvents: (...args: unknown[]) => mockVerify(...args),
}));

const DROP_ID = "drop-1";
const signedEvents = {
  drop_id: DROP_ID,
  current_event_id: null,
  events: [],
  grants: [],
};

const renderWithQueryClient = (ui: ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>
  );

const signedVerdict = (
  overrides: Partial<Extract<DropSignatureVerdict, { status: "signed" }>> = {}
): DropSignatureVerdict => ({
  status: "signed",
  currentContentSigned: true,
  signature: {
    eventId: `0x${"e".repeat(64)}`,
    wallet: "0x1111111111111111111111111111111111111111",
    deviceKey:
      "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    grantExpiresAt: Date.UTC(2027, 3, 16, 12, 0),
    walletSignature: "verified",
  },
  ...overrides,
});

describe("drop signature details", () => {
  beforeEach(() => {
    mockEnabled = true;
    mockFetchSignedEvents.mockReset().mockResolvedValue(signedEvents);
    mockVerify.mockReset();
  });

  it("verifies the fetched events and shows who signed the current content", async () => {
    mockVerify.mockResolvedValue(signedVerdict());
    renderWithQueryClient(
      <DropSignatureDialog dropId={DROP_ID} isOpen onClose={jest.fn()} />
    );

    expect(screen.getByRole("dialog", { name: "Signature" })).toBeVisible();
    expect(await screen.findByText("Signed by its author")).toBeVisible();
    expect(mockFetchSignedEvents).toHaveBeenCalledWith(
      DROP_ID,
      expect.any(AbortSignal)
    );
    expect(mockVerify).toHaveBeenCalledWith(signedEvents, {
      verifyContractSignature: undefined,
      displayed: undefined,
    });
    expect(screen.getByText("0x1111…1111")).toBeVisible();
    expect(screen.getByText("d75a9801...f707511a")).toBeVisible();
    expect(screen.getByText("Verified in your browser")).toBeVisible();
    expect(screen.getByText("The signed version")).toBeVisible();
  });

  it("explains contract wallets and content changed after signing", async () => {
    mockVerify.mockResolvedValue(
      signedVerdict({
        currentContentSigned: false,
        signature: {
          ...(
            signedVerdict() as Extract<
              DropSignatureVerdict,
              { status: "signed" }
            >
          ).signature,
          walletSignature: "contract-wallet",
        },
      })
    );
    renderWithQueryClient(
      <DropSignatureDialog dropId={DROP_ID} isOpen onClose={jest.fn()} />
    );

    expect(
      await screen.findByText("Contract wallet: verified by 6529.io at sign-in")
    ).toBeVisible();
    expect(screen.getByText("Changed without a signature")).toBeVisible();
  });

  it.each([
    ["unsigned", "Not signed by its author"],
    ["invalid", "The signature could not be verified"],
  ] as const)("reports %s drops", async (status, text) => {
    mockVerify.mockResolvedValue({ status });
    renderWithQueryClient(
      <DropSignatureDialog dropId={DROP_ID} isOpen onClose={jest.fn()} />
    );
    expect(await screen.findByText(text)).toBeVisible();
  });

  it("offers a retry when the events cannot be loaded and closes on request", async () => {
    const onClose = jest.fn();
    // The query retries once before showing the error.
    mockFetchSignedEvents
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network"));
    mockVerify.mockResolvedValue({ status: "unsigned" });
    renderWithQueryClient(
      <DropSignatureDialog dropId={DROP_ID} isOpen onClose={onClose} />
    );

    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 })
    ).toHaveTextContent("Couldn't load the signature details.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Not signed by its author")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("does nothing while the flag is off or the dialog is closed", () => {
    mockEnabled = false;
    const { rerender } = renderWithQueryClient(
      <DropSignatureDialog dropId={DROP_ID} isOpen onClose={jest.fn()} />
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    mockEnabled = true;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <DropSignatureDialog
          dropId={DROP_ID}
          isOpen={false}
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockFetchSignedEvents).not.toHaveBeenCalled();
  });

  it("adds a Signature menu item only for posted drops while enabled", async () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <DropSignatureMenuItem dropId={DROP_ID} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Signature" }));
    expect(onSelect).toHaveBeenCalled();

    rerender(
      <DropSignatureMenuItem dropId="temp-1" onSelect={onSelect} mobile />
    );
    expect(screen.queryByRole("button", { name: "Signature" })).toBeNull();

    mockEnabled = false;
    rerender(
      <DropSignatureMenuItem dropId={DROP_ID} onSelect={onSelect} mobile />
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Signature" })).toBeNull()
    );
  });
});
