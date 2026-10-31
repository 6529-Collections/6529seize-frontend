import { WithDropAuthorSignedMarker } from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import DropSignatureDialog from "@/components/waves/drops/signature/DropSignatureDialog";
import userEvent from "@testing-library/user-event";
import DropSignatureMenuItem from "@/components/waves/drops/signature/DropSignatureMenuItem";
import type { DropSignatureVerdict } from "@/lib/device-signing/verify-signed-events";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps, ReactElement } from "react";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockFetchSignedEvents = jest.fn();
const mockFetchAuthorWallets = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDropSignedEvents: (...args: unknown[]) => mockFetchSignedEvents(...args),
  fetchAuthorWallets: (...args: unknown[]) => mockFetchAuthorWallets(...args),
}));

jest.mock("wagmi", () => ({
  usePublicClient: () => undefined,
}));

const mockVerify = jest.fn();
jest.mock("@/lib/device-signing/verify-signed-events", () => ({
  verifyDropSignedEvents: (...args: unknown[]) => mockVerify(...args),
  toDisplayedDropContent: () => ({ title: null, parts: [] }),
}));

const DROP_ID = "drop-1";
const signedEvents = {
  drop_id: DROP_ID,
  current_event_id: null,
  events: [],
  grants: [],
};

const AUTHOR_ADDRESS = "0x1111111111111111111111111111111111111111";
const shownDrop = {
  title: null,
  parts: [],
  wave: { id: "wave-1" },
  author: { primary_address: AUTHOR_ADDRESS },
} as unknown as ComponentProps<typeof DropSignatureDialog>["drop"];
const signedEventsWithAPost = {
  ...signedEvents,
  events: [{ id: `0x${"1".repeat(64)}`, kind: 1 }],
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
    mockFetchAuthorWallets.mockReset();
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
      expected: undefined,
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
    // The browser did not check this wallet signature, so it must not claim to.
    expect(
      screen.getByText(
        "Your browser checked the device signature itself. This contract wallet's sign-in signature was checked by 6529.io at sign-in, not by your browser."
      )
    ).toBeVisible();
    expect(
      screen.queryByText(
        "Your browser checked this signature itself, without relying on 6529.io."
      )
    ).toBeNull();
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
    ).toHaveTextContent("Couldn't check the signature right now.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Not signed by its author")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("checks signed events against the author's wallets", async () => {
    mockFetchSignedEvents.mockResolvedValue(signedEventsWithAPost);
    mockFetchAuthorWallets.mockResolvedValue([AUTHOR_ADDRESS, "0xabc"]);
    mockVerify.mockResolvedValue(signedVerdict());
    renderWithQueryClient(
      <DropSignatureDialog
        dropId={DROP_ID}
        drop={shownDrop}
        isOpen
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("Signed by its author")).toBeVisible();
    expect(
      screen.getByText(
        "Your browser checked this signature itself, without relying on 6529.io."
      )
    ).toBeVisible();
    expect(mockFetchAuthorWallets).toHaveBeenCalledWith(
      AUTHOR_ADDRESS,
      expect.any(AbortSignal)
    );
    expect(mockVerify).toHaveBeenCalledWith(
      signedEventsWithAPost,
      expect.objectContaining({
        expected: {
          dropId: DROP_ID,
          waveId: "wave-1",
          authorWallets: [AUTHOR_ADDRESS, "0xabc"],
        },
      })
    );
  });

  it("needs no identity lookup for a drop without signed events", async () => {
    mockVerify.mockResolvedValue({ status: "unsigned" });
    renderWithQueryClient(
      <DropSignatureDialog
        dropId={DROP_ID}
        drop={shownDrop}
        isOpen
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("Not signed by its author")).toBeVisible();
    expect(mockFetchAuthorWallets).not.toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalledWith(
      signedEvents,
      expect.objectContaining({
        expected: { dropId: DROP_ID, waveId: "wave-1", authorWallets: [] },
      })
    );
  });

  it("offers Try again, never a verdict, when the author's wallets cannot be loaded", async () => {
    mockFetchSignedEvents.mockResolvedValue(signedEventsWithAPost);
    // The query retries once before showing the error.
    mockFetchAuthorWallets
      .mockRejectedValueOnce(new Error("503"))
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValue([AUTHOR_ADDRESS]);
    mockVerify.mockResolvedValue(signedVerdict());
    renderWithQueryClient(
      <DropSignatureDialog
        dropId={DROP_ID}
        drop={shownDrop}
        isOpen
        onClose={jest.fn()}
      />
    );

    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 })
    ).toHaveTextContent("Couldn't check the signature right now.");
    expect(mockVerify).not.toHaveBeenCalled();
    expect(
      screen.queryByText("The signature could not be verified")
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Signed by its author")).toBeVisible();
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

  it("closes on Escape and keeps Tab inside the real dialog opened from a seal in a clickable card", async () => {
    mockVerify.mockResolvedValue(signedVerdict());
    const user = userEvent.setup();
    const onCardKeyDown = jest.fn();
    const onCardClick = jest.fn();
    renderWithQueryClient(
      <div
        role="button"
        tabIndex={0}
        onKeyDown={onCardKeyDown}
        onClick={onCardClick}
      >
        <WithDropAuthorSignedMarker
          drop={
            {
              ...shownDrop,
              id: DROP_ID,
              is_author_signed: true,
            } as never
          }
        >
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      </div>
    );

    const seal = screen.getByRole("button", { name: "Signed by its author" });
    seal.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog", { name: "Signature" });
    await within(dialog).findByText("Signed by its author");

    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(onCardClick).not.toHaveBeenCalled();
    expect(onCardKeyDown).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "Enter" })
    );
  });
});
