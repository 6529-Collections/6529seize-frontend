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

interface DialogProps {
  readonly signed?: boolean;
  readonly onRevoke?: (device: SecurityDevice) => Promise<void>;
}

function renderDialog(
  devices: readonly SecurityDevice[],
  props: DialogProps = {}
) {
  const onRevoke = jest.fn(props.onRevoke ?? (async () => undefined));
  const onClose = jest.fn();
  const onDone = jest.fn();
  const ui = (list: readonly SecurityDevice[], next: DialogProps) => (
    <CleanUpDialog
      devices={list}
      open
      signed={next.signed ?? props.signed ?? false}
      onRevoke={next.onRevoke ?? onRevoke}
      onClose={onClose}
      onDone={onDone}
    />
  );
  const view = render(ui(devices, {}));
  return {
    onRevoke,
    onClose,
    onDone,
    /** A later render: the list, and optionally the mode and handler. */
    update: (list: readonly SecurityDevice[], next: DialogProps = {}) =>
      view.rerender(ui(list, next)),
  };
}

const confirmButton = (count: number) =>
  within(dialog()).getByRole("button", {
    name: count === 1 ? "Revoke 1 device" : `Revoke ${count} devices`,
  });

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

  it("re-checks each device right before its revoke, skipping one no longer eligible", async () => {
    const a = device("a");
    const b = device("b");
    let update: (list: readonly SecurityDevice[]) => void = () => undefined;
    const rendered = renderDialog([a, b], {
      onRevoke: async (target) => {
        if (target.id === "a") {
          // While A is revoked, B stops being an earlier setup.
          update([]);
        }
      },
    });
    update = rendered.update;
    await act(async () => {
      fireEvent.click(
        within(dialog()).getByRole("button", { name: "Revoke 2 devices" })
      );
    });
    expect(rendered.onRevoke).toHaveBeenCalledTimes(1);
    expect(rendered.onRevoke).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" })
    );
  });

  it("reports a device whose permissions changed after review and keeps it for a new confirm", async () => {
    const a = device("a");
    let update: (list: readonly SecurityDevice[]) => void = () => undefined;
    const rendered = renderDialog([a, device("b")], {
      onRevoke: async (target) => {
        if (target.id === "a") {
          // B gains encrypted DMs meanwhile: not what was reviewed.
          update([device("b", { dms: true })]);
        }
      },
    });
    update = rendered.update;
    await act(async () => {
      fireEvent.click(confirmButton(2));
    });
    expect(rendered.onRevoke).toHaveBeenCalledTimes(1);
    // Not a success: the dialog stays open, naming B apart from A's revoke.
    expect(rendered.onClose).not.toHaveBeenCalled();
    expect(rendered.onDone).not.toHaveBeenCalled();
    const alert = within(dialog()).getByRole("alert");
    expect(alert).toHaveTextContent("1 device revoked.");
    expect(alert).toHaveTextContent(
      "Not revoked because they changed while this was open: Browser b."
    );
    expect(alert).not.toHaveTextContent("Couldn’t revoke");
    // B is listed as it is now, still selected: revoked on a new confirm.
    expect(checkbox("b")).toBeChecked();
    expect(checkbox("b")).toHaveAccessibleName(/encrypted DMs/i);
    await act(async () => {
      fireEvent.click(confirmButton(1));
    });
    expect(rendered.onRevoke).toHaveBeenCalledTimes(2);
    expect(rendered.onRevoke).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "b" })
    );
    expect(rendered.onDone).toHaveBeenCalledWith(1);
  });

  it("stops the batch when revokes start being signed, and doesn't switch handlers mid-batch", async () => {
    const signedRevoke = jest.fn(async () => undefined);
    let update: (
      list: readonly SecurityDevice[],
      next?: DialogProps
    ) => void = () => undefined;
    const b = device("b", { dms: true });
    const rendered = renderDialog([device("a"), b], {
      signed: false,
      onRevoke: async (target) => {
        if (target.id === "a") {
          // Encrypted DMs start here while A is revoked: a signed revoke
          // of B would delete its chats, which wasn't what was confirmed.
          update([b], { signed: true, onRevoke: signedRevoke });
        }
      },
    });
    update = rendered.update;
    expect(dialog()).not.toHaveTextContent("deletes the encrypted chats");
    await act(async () => {
      fireEvent.click(confirmButton(2));
    });
    expect(rendered.onRevoke).toHaveBeenCalledTimes(1);
    expect(signedRevoke).not.toHaveBeenCalled();
    expect(rendered.onClose).not.toHaveBeenCalled();
    expect(within(dialog()).getByRole("alert")).toHaveTextContent(
      "Encrypted DMs started or stopped in this browser while this ran."
    );
    // The dialog now shows the signed terms; a new confirm uses them.
    expect(dialog()).toHaveTextContent("deletes the encrypted chats");
    await act(async () => {
      fireEvent.click(confirmButton(1));
    });
    expect(signedRevoke).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b" })
    );
  });

  it("revokes each device with the handler of the latest render while the mode holds", async () => {
    const later = jest.fn(async () => undefined);
    let update: (
      list: readonly SecurityDevice[],
      next?: DialogProps
    ) => void = () => undefined;
    const b = device("b");
    const rendered = renderDialog([device("a"), b], {
      onRevoke: async (target) => {
        if (target.id === "a") {
          update([b], { onRevoke: later });
        }
      },
    });
    update = rendered.update;
    await act(async () => {
      fireEvent.click(confirmButton(2));
    });
    expect(later).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
    expect(rendered.onDone).toHaveBeenCalledWith(2);
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
