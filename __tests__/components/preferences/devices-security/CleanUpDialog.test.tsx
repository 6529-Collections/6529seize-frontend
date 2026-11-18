import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { SecurityDevice } from "@/components/preferences/devices-security/classifyDevices";
import { CleanUpDialog } from "@/components/preferences/devices-security/CleanUpDialog";

const NOW = Date.UTC(2026, 10, 9, 15, 0);
const DAY = 24 * 60 * 60 * 1000;

const device = (
  id: string,
  { dms = false }: { readonly dms?: boolean } = {}
): SecurityDevice =>
  ({
    id,
    label: `Browser ${id}`,
    platform: "web",
    isThisDevice: false,
    signedPosts: { status: "active", expiresAt: NOW + DAY, endedAt: null },
    encryptedDms: dms
      ? { status: "active", expiresAt: NOW + DAY, endedAt: null }
      : null,
    grant: null,
    encryptedDevice: null,
    createdAt: NOW - 10 * DAY,
    lastActiveAt: null,
    expiresAt: NOW + DAY,
    endedAt: null,
    wallet: null,
    unverified: false,
  }) as SecurityDevice;

function renderDialog(
  devices: readonly SecurityDevice[],
  props: {
    readonly signed?: boolean;
    readonly onRevoke?: (device: SecurityDevice) => Promise<void>;
  } = {}
) {
  const onRevoke = jest.fn(props.onRevoke ?? (async () => undefined));
  const ui = (list: readonly SecurityDevice[]) => (
    <CleanUpDialog
      devices={list}
      open
      signed={props.signed ?? false}
      onRevoke={onRevoke}
      onClose={jest.fn()}
      onDone={jest.fn()}
    />
  );
  const view = render(ui(devices));
  return {
    onRevoke,
    update: (list: readonly SecurityDevice[]) => view.rerender(ui(list)),
  };
}

const dialog = () => screen.getByRole("dialog", { name: "Clean up earlier setups" });
const checkbox = (id: string) =>
  within(dialog()).getByRole("checkbox", { name: new RegExp(`^Browser ${id}`) });

describe("CleanUpDialog", () => {
  it("retries only the confirmed devices still eligible, leaving a newly eligible one unselected", async () => {
    const a = device("a");
    const b = device("b");
    const { onRevoke, update } = renderDialog([a, b], {
      onRevoke: async (target) => {
        if (target.id === "b") {
          throw new Error("offline");
        }
      },
    });
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole("button", { name: "Revoke 2 devices" })
      );
    });
    expect(within(dialog()).getByRole("alert")).toHaveTextContent(
      "Couldn’t revoke Browser b."
    );
    // A was revoked and left the list; C became eligible meanwhile.
    update([b, device("c")]);
    expect(checkbox("b")).toBeChecked();
    expect(checkbox("c")).not.toBeChecked();
    onRevoke.mockClear();
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole("button", { name: "Revoke 1 device" })
      );
    });
    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onRevoke).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("doesn't revoke a selected device that is no longer eligible", async () => {
    const { onRevoke, update } = renderDialog([device("a"), device("b")]);
    update([device("b")]);
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole("button", { name: "Revoke 1 device" })
      );
    });
    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onRevoke).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("warns that signed revokes delete saved chats when encrypted DMs are selected", () => {
    renderDialog([device("a", { dms: true })], { signed: true });
    expect(dialog()).toHaveTextContent(
      "deletes the encrypted chats saved on it once it confirms"
    );
    fireEvent.click(checkbox("a"));
    expect(dialog()).not.toHaveTextContent("deletes the encrypted chats");
  });

  it("doesn't warn when the revokes aren't signed or no encrypted DMs are selected", () => {
    const { update } = renderDialog([device("a", { dms: true })], {
      signed: false,
    });
    expect(dialog()).not.toHaveTextContent("deletes the encrypted chats");
    update([device("b")]);
    expect(dialog()).not.toHaveTextContent("deletes the encrypted chats");
  });
});
