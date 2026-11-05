import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { E2eeComposer } from "@/components/e2ee/conversation/E2eeComposer";
import {
  contextFor,
  conversation,
  createFakeE2eeEngine,
  E2eeTestProvider,
  GROUP_G,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

type ComposerProps = ComponentProps<typeof E2eeComposer>;

const png = (name: string): File =>
  new File(["png-bytes"], name, { type: "image/png" });

const pdf = (name: string): File =>
  new File(["%PDF"], name, { type: "application/pdf" });

const fileItem = (file: File) => ({
  kind: "file",
  type: file.type,
  getAsFile: () => file,
});

const textItem = () => ({
  kind: "string",
  type: "text/plain",
  getAsFile: () => null,
});

/** A paste's clipboard; Chrome lists a pasted file in `files` and `items`. */
const clipboard = ({
  files = [],
  items = files.map(fileItem),
  text = "",
}: {
  readonly files?: File[];
  readonly items?: ReturnType<typeof fileItem | typeof textItem>[];
  readonly text?: string;
}) => ({
  files,
  items: text ? [...items, textItem()] : items,
  getData: (type: string) => (type === "text/plain" ? text : ""),
});

const renderComposer = (overrides: Partial<ComposerProps> = {}) => {
  const convo = conversation();
  const engine = createFakeE2eeEngine({ conversations: [convo] });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeComposer
        conversation={convo}
        engine={engine}
        selfProfileId={SELF_ID}
        replyTo={null}
        onCancelReply={jest.fn()}
        editing={null}
        onCancelEdit={jest.fn()}
        disabledReasonKey={null}
        attachmentsEnabled
        {...overrides}
      />
    </E2eeTestProvider>
  );
  const input = screen.getByLabelText<HTMLTextAreaElement>("Encrypted message");
  return { engine, input };
};

const paste = (target: HTMLElement, data: ReturnType<typeof clipboard>) =>
  fireEvent.paste(target, { clipboardData: data });

/** Chooses files through the attach control's file input. */
const pickFiles = (files: File[]) => {
  const fileInput =
    document.querySelector<HTMLInputElement>('input[type="file"]');
  fireEvent.change(fileInput!, { target: { files } });
};

const attachmentNames = (): string[] => {
  const list = screen.queryByRole("list", { name: "Attachments" });
  return list
    ? within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent ?? "")
    : [];
};

describe("E2eeComposer paste", () => {
  it("attaches a pasted image and sends it like a picked file", async () => {
    const { engine, input } = renderComposer();
    const image = png("image.png");

    const notPrevented = paste(input, clipboard({ files: [image] }));

    expect(notPrevented).toBe(false);
    expect(attachmentNames()).toEqual(["image.png"]);
    expect(input).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 pasted image attached"
    );

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(engine.send).toHaveBeenCalledWith(GROUP_G, {
        text: "",
        mentions: [],
        reply: null,
        files: [image],
      })
    );
    expect(attachmentNames()).toEqual([]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    // A file picked after the send does not bring the old notice back.
    pickFiles([pdf("notes.pdf")]);
    expect(attachmentNames()).toEqual(["notes.pdf"]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("ends the paste notice when an attachment is removed", () => {
    const { input } = renderComposer();
    paste(input, clipboard({ files: [png("one.png"), png("two.png")] }));

    fireEvent.click(screen.getByRole("button", { name: "Remove one.png" }));
    expect(attachmentNames()).toEqual(["two.png"]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole("button", { name: "Remove two.png" }));
    pickFiles([pdf("notes.pdf")]);
    expect(attachmentNames()).toEqual(["notes.pdf"]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("attaches several pasted images at once", () => {
    const { input } = renderComposer();

    paste(input, clipboard({ files: [png("one.png"), png("two.png")] }));

    expect(attachmentNames()).toEqual(["one.png", "two.png"]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 pasted images attached"
    );
  });

  it("leaves a plain-text paste to the browser", () => {
    const { input } = renderComposer();
    fireEvent.change(input, { target: { value: "draft" } });

    const notPrevented = paste(input, clipboard({ text: "pasted words" }));

    expect(notPrevented).toBe(true);
    expect(input).toHaveValue("draft");
    expect(attachmentNames()).toEqual([]);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("keeps the text pasted together with an image, at the selection", () => {
    const { input } = renderComposer();
    fireEvent.change(input, { target: { value: "hello world" } });
    input.setSelectionRange(6, 11);

    const notPrevented = paste(
      input,
      clipboard({ files: [png("shot.png")], text: "there\r\nfriend" })
    );

    expect(notPrevented).toBe(false);
    expect(input).toHaveValue("hello there\nfriend");
    expect(attachmentNames()).toEqual(["shot.png"]);
  });

  it("holds text pasted with an image to the same length rule as a native paste", () => {
    const { input } = renderComposer();
    // The box has no maxlength, so a native paste inserts everything and the
    // limit is enforced at send; the manual insert does the same.
    expect(input).not.toHaveAttribute("maxlength");
    const long = "a".repeat(10_001);

    paste(input, clipboard({ files: [png("image.png")], text: long }));

    expect(input).toHaveValue(long);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Messages can be up to 10,000 characters."
    );
  });

  it("ignores non-image files in a paste", () => {
    const { input } = renderComposer();
    const notes = pdf("notes.pdf");

    expect(paste(input, clipboard({ files: [notes] }))).toBe(true);
    expect(attachmentNames()).toEqual([]);

    paste(input, clipboard({ files: [notes, png("photo.png")] }));
    expect(attachmentNames()).toEqual(["photo.png"]);
  });

  it("reads images from clipboard items when no files are listed", () => {
    const { input } = renderComposer();

    paste(input, clipboard({ items: [fileItem(png("from-items.png"))] }));

    expect(attachmentNames()).toEqual(["from-items.png"]);
  });

  it("adds an image listed in both files and items once", () => {
    const { input } = renderComposer();

    paste(
      input,
      clipboard({
        files: [png("image.png")],
        items: [fileItem(png("image.png"))],
      })
    );

    expect(attachmentNames()).toEqual(["image.png"]);
  });

  it("keeps an image listed only in items next to listed files", () => {
    const { input } = renderComposer();

    paste(
      input,
      clipboard({
        files: [png("listed.png")],
        items: [fileItem(png("listed.png")), fileItem(png("items-only.png"))],
      })
    );

    expect(attachmentNames()).toEqual(["listed.png", "items-only.png"]);
  });

  it("applies the attach control's count limit across picked and pasted files", () => {
    const { input } = renderComposer();
    const picked = Array.from({ length: 9 }, (_, index) =>
      png(`picked-${index}.png`)
    );
    pickFiles(picked);

    paste(input, clipboard({ files: [png("tenth.png"), png("eleventh.png")] }));

    const names = attachmentNames();
    expect(names).toHaveLength(10);
    expect(names).toContain("tenth.png");
    expect(names).not.toContain("eleventh.png");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You can attach up to 10 files."
    );
    // Only the accepted image is announced.
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 pasted image attached"
    );
  });

  it("applies the attach control's size limit to pasted images", () => {
    const { input } = renderComposer();
    const huge = png("huge.png");
    Object.defineProperty(huge, "size", { value: 26 * 1024 * 1024 });

    const notPrevented = paste(input, clipboard({ files: [huge] }));

    expect(notPrevented).toBe(false);
    expect(attachmentNames()).toEqual([]);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "huge.png is larger than 25 MB."
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    paste(input, clipboard({ files: [huge, png("small.png")] }));

    expect(attachmentNames()).toEqual(["small.png"]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 pasted image attached"
    );
  });

  it("leaves pastes alone while editing a message", () => {
    const { input } = renderComposer({
      editing: message({ id: "m1", senderProfileId: SELF_ID, text: "old" }),
    });

    expect(paste(input, clipboard({ files: [png("image.png")] }))).toBe(true);
    expect(attachmentNames()).toEqual([]);
  });

  it("leaves pastes alone while attachments are switched off", () => {
    const { input } = renderComposer({ attachmentsEnabled: false });

    expect(paste(input, clipboard({ files: [png("image.png")] }))).toBe(true);
    expect(attachmentNames()).toEqual([]);
  });
});
