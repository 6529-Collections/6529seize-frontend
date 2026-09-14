import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import CreateWaveFlow from "@/components/waves/create-wave/CreateWaveFlow";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/waves/create-wave/CreateWave", () => ({
  __esModule: true,
  default: function CreateWaveForm({
    onBack,
    onSuccess,
  }: {
    readonly onBack: () => void;
    readonly onSuccess: () => void;
  }) {
    const [name, setName] = useState("");
    return (
      <CreateWaveFlow title="Create Wave" onBack={onBack}>
        <label>
          Wave Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="button" onClick={onSuccess}>
          Complete creation
        </button>
      </CreateWaveFlow>
    );
  },
}));

function Harness({ parentWaveId }: { readonly parentWaveId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open creation
      </button>
      <CreateWaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        profile={{ handle: "alice" } as ApiIdentity}
        parentWaveId={parentWaveId}
      />
    </>
  );
}

describe.each([undefined, "parent-wave"])(
  "CreateWaveModal (%s)",
  (parentWaveId) => {
    it("preserves live input after Escape and backdrop click, and supports keyboard Close", async () => {
      const user = userEvent.setup();
      render(<Harness {...(parentWaveId ? { parentWaveId } : {})} />);
      const opener = screen.getByRole("button", { name: "Open creation" });
      await user.click(opener);
      const name = screen.getByRole("textbox", { name: "Wave Name" });
      await user.type(name, "My unfinished wave");

      await user.keyboard("{Escape}");
      expect(name).toBeVisible();
      expect(name).toHaveFocus();
      expect(name).toHaveValue("My unfinished wave");

      const backdrop = document.querySelector(".tw-fixed.tw-inset-0");
      expect(backdrop).not.toBeNull();
      await user.click(backdrop!);
      expect(name).toBeVisible();
      expect(name).toHaveValue("My unfinished wave");

      const close = screen.getByRole("button", { name: "Close" });
      close.focus();
      await user.keyboard("{Escape}");
      expect(close).toHaveFocus();
      expect(name).toBeVisible();
      await user.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      await waitFor(() => expect(opener).toHaveFocus());
    });

    it("closes an untouched form and closes after successful creation", async () => {
      const user = userEvent.setup();
      render(<Harness {...(parentWaveId ? { parentWaveId } : {})} />);
      const opener = screen.getByRole("button", { name: "Open creation" });
      await user.click(opener);
      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      await user.click(opener);
      await user.click(
        screen.getByRole("button", { name: "Complete creation" })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  }
);
