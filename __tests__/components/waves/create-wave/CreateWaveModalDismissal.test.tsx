import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useImperativeHandle, useState, type ReactNode, type Ref } from "react";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CreateWaveDescriptionHandles } from "@/components/waves/create-wave/description/CreateWaveDescription";
import type { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ contentContainerStyle: {} }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest
    .fn()
    .mockResolvedValue({ id: "parent-admin", name: "Admins" }),
}));
jest.mock("@/components/waves/create-wave/hooks/useMemeCardCount", () => ({
  useMemeCardCount: () => ({ data: null, isError: false }),
}));
jest.mock(
  "@/components/waves/create-wave/hooks/useWaveGroupValidation",
  () => ({
    useWaveGroupValidation: () => ({ isFetching: false }),
  })
);
jest.mock(
  "@/components/waves/create-wave/hooks/useKeyboardFocusScroll",
  () => ({
    __esModule: true,
    default: () => {},
  })
);
jest.mock(
  "@/components/waves/create-wave/hooks/useCreateWaveSubmission",
  () => ({
    useCreateWaveSubmission: ({ onSuccess }: { onSuccess: () => void }) => ({
      submitting: false,
      onComplete: onSuccess,
      subwaveAccessConfirmation: { isOpen: false },
    }),
  })
);
jest.mock("@/components/waves/create-wave/CreateWaveLayout", () => ({
  __esModule: true,
  default: ({
    children,
    onComplete,
  }: {
    children: ReactNode;
    onComplete: () => void;
  }) => (
    <>
      {children}
      <button type="button" onClick={onComplete}>
        Complete creation
      </button>
    </>
  ),
}));
jest.mock("@/components/waves/create-wave/CreateWaveStepContent", () => ({
  __esModule: true,
  default: ({
    controller,
  }: {
    controller: ReturnType<typeof useWaveConfig>;
  }) => {
    const { config, setOverview } = controller;
    return (
      <>
        <label>
          Wave Name
          <input
            value={config.overview.name}
            onChange={(event) =>
              setOverview({ ...config.overview, name: event.target.value })
            }
          />
        </label>
        <label>
          Picture
          <input
            type="file"
            onChange={(event) =>
              setOverview({
                ...config.overview,
                image: event.target.files?.[0] ?? null,
              })
            }
          />
        </label>
        <button
          type="button"
          onClick={() => controller.onChatEnabledChange(false)}
        >
          Disable chat
        </button>
        <button
          type="button"
          onClick={() =>
            controller.onStep({
              step: CreateWaveStep.DESCRIPTION,
              direction: "backward",
            })
          }
        >
          Edit description
        </button>
      </>
    );
  },
}));
jest.mock(
  "@/components/waves/create-wave/description/CreateWaveDescription",
  () => ({
    __esModule: true,
    default: function Description({
      ref,
    }: {
      ref: Ref<CreateWaveDescriptionHandles>;
    }) {
      const [text, setText] = useState("");
      const [files, setFiles] = useState<File[]>([]);
      useImperativeHandle(ref, () => ({
        requestDrop: () => null,
        getDropSnapshot: () => ({
          title: null,
          parts: [{ content: text || "\n", media: files, quoted_drop: null }],
          metadata: [],
          mentioned_users: [],
          mentioned_waves: [],
          referenced_nfts: [],
          signature: null,
          is_safe_signature: false,
        }),
      }));
      return (
        <>
          <label>
            Description
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <label>
            Description attachment
            <input
              type="file"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
        </>
      );
    },
  })
);

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
        parentAdminGroupId={parentWaveId ? "parent-admin" : undefined}
        parentViewGroupId={parentWaveId ? "parent-view" : undefined}
      />
    </>
  );
}

const confirmation = () =>
  screen.getByRole("dialog", { name: "Discard your changes?" });
const getName = () => screen.getByRole("textbox", { name: "Wave Name" });
type Exit = "Close" | "Escape" | "backdrop";

async function leave(user: ReturnType<typeof userEvent.setup>, exit: Exit) {
  if (exit === "Escape") {
    await user.keyboard("{Escape}");
  } else if (exit === "Close") {
    await user.click(screen.getByRole("button", { name: "Close" }));
  } else {
    const backdrop = document.querySelector(".tw-fixed.tw-inset-0");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop!);
  }
}

describe.each([undefined, "parent-wave"])(
  "CreateWaveModal (%s)",
  (parentWaveId) => {
    beforeEach(() => localStorage.clear());

    async function openForm() {
      const user = userEvent.setup();
      render(<Harness {...(parentWaveId ? { parentWaveId } : {})} />);
      const opener = screen.getByRole("button", { name: "Open creation" });
      await user.click(opener);
      return { user, opener };
    }

    it.each<Exit>(["Close", "Escape", "backdrop"])(
      "confirms %s with live work and keeps editing safely",
      async (exit) => {
        const { user, opener } = await openForm();
        const name = getName();
        await user.type(name, "My unfinished wave");
        await leave(user, exit);
        expect(confirmation()).toHaveAccessibleDescription(
          "Unsaved changes will be lost. Existing saved drafts will remain."
        );
        await user.click(
          within(confirmation()).getByRole("button", { name: "Keep editing" })
        );
        await waitFor(() =>
          expect(
            screen.queryByRole("dialog", { name: "Discard your changes?" })
          ).not.toBeInTheDocument()
        );
        expect(name).toHaveValue("My unfinished wave");
        if (exit === "Escape") await waitFor(() => expect(name).toHaveFocus());

        await leave(user, exit);
        await user.click(
          within(confirmation()).getByRole("button", {
            name: "Discard changes",
          })
        );
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );
        await waitFor(() => expect(opener).toHaveFocus());
        await user.click(opener);
        expect(getName()).toHaveValue("");
        expect(
          screen.queryByRole("dialog", { name: "Discard your changes?" })
        ).not.toBeInTheDocument();
      }
    );

    it.each<Exit>(["Close", "Escape", "backdrop"])(
      "closes an untouched form with %s, including inherited defaults",
      async (exit) => {
        const { user, opener } = await openForm();
        await leave(user, exit);
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );
        await waitFor(() => expect(opener).toHaveFocus());
        expect(localStorage.getItem("create-wave-drafts:v1")).toBeNull();
      }
    );

    it("closes immediately after all name edits are cleared", async () => {
      const { user } = await openForm();
      await user.type(getName(), "Removed again");
      await user.clear(getName());
      await leave(user, "Close");
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });

    it("protects a picture without requiring a name", async () => {
      const { user } = await openForm();
      const picture = screen.getByLabelText("Picture");
      const file = new File(["picture"], "picture.png", { type: "image/png" });
      await user.upload(picture, file);
      await leave(user, "Close");
      await user.click(
        within(confirmation()).getByRole("button", { name: "Keep editing" })
      );
      expect(picture).toHaveProperty(
        "files",
        expect.objectContaining({ 0: file })
      );
    });

    it("protects changed settings without requiring a name", async () => {
      const { user } = await openForm();
      await user.click(screen.getByRole("button", { name: "Disable chat" }));
      await leave(user, "Close");
      expect(confirmation()).toBeVisible();
    });

    it("protects description-only work and treats confirmation Escape as Keep editing", async () => {
      const { user } = await openForm();
      await user.click(
        screen.getByRole("button", { name: "Edit description" })
      );
      const description = screen.getByRole("textbox", { name: "Description" });
      await user.type(description, "My description");
      await leave(user, "Escape");
      expect(confirmation()).toBeVisible();
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "Discard your changes?" })
        ).not.toBeInTheDocument()
      );
      expect(description).toHaveValue("My description");
      await waitFor(() => expect(description).toHaveFocus());
    });

    it.each(["untouched", "cleared"])(
      "closes without confirmation when the description is %s",
      async (state) => {
        const { user } = await openForm();
        await user.click(
          screen.getByRole("button", { name: "Edit description" })
        );
        if (state === "cleared") {
          const description = screen.getByRole("textbox", {
            name: "Description",
          });
          await user.type(description, "Removed again");
          await user.clear(description);
        }
        await leave(user, "Close");
        await waitFor(() =>
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        );
      }
    );

    it("protects description attachments without text", async () => {
      const { user } = await openForm();
      await user.click(
        screen.getByRole("button", { name: "Edit description" })
      );
      const attachment = screen.getByLabelText("Description attachment");
      const file = new File(["attachment"], "attachment.png", {
        type: "image/png",
      });
      await user.upload(attachment, file);
      await leave(user, "Close");
      await user.click(
        within(confirmation()).getByRole("button", { name: "Keep editing" })
      );
      expect(attachment).toHaveProperty(
        "files",
        expect.objectContaining({ 0: file })
      );
    });

    it("closes after successful creation without a discard prompt", async () => {
      const { user } = await openForm();
      await user.type(getName(), "Created wave");
      await user.click(
        screen.getByRole("button", { name: "Complete creation" })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
    });
  }
);
