jest.unmock("lexical");
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { E2eeComposer } from "@/components/e2ee/conversation/E2eeComposer";
import { downloadGiphyGif, GifDownloadError } from "@/lib/e2ee/giphy";
import { composerText, setComposerText } from "./composerTestUtils";
import {
  contextFor,
  conversation,
  createFakeE2eeEngine,
  E2eeTestProvider,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

jest.mock("@/lib/e2ee/giphy", () => ({
  ...jest.requireActual("@/lib/e2ee/giphy"),
  downloadGiphyGif: jest.fn(),
}));
jest.mock("@/components/waves/CreateDropGifPickerLoader", () => ({
  createDropGifPickerLoader: { preload: jest.fn() },
}));
jest.mock("@/components/waves/LazyCreateDropGifPicker", () => ({
  __esModule: true,
  default: ({
    show,
    onSelect,
    description,
  }: {
    show: boolean;
    onSelect: (url: string) => void;
    description?: string;
  }) =>
    show ? (
      <div role="dialog" aria-label="GIF search">
        <p>{description}</p>
        <button
          onClick={() =>
            onSelect("https://media.giphy.com/media/test/giphy.gif")
          }
        >
          Select test GIF
        </button>
      </div>
    ) : null,
}));

type Props = ComponentProps<typeof E2eeComposer>;
const mockDownload = jest.mocked(downloadGiphyGif);
const gif = () => new File(["GIF89a"], "giphy.gif", { type: "image/gif" });

function setup(overrides: Partial<Props> = {}) {
  const convo = conversation();
  const engine = createFakeE2eeEngine({ conversations: [convo] });
  const props: Props = {
    conversation: convo,
    engine,
    selfProfileId: SELF_ID,
    replyTo: null,
    onCancelReply: jest.fn(),
    editing: null,
    onCancelEdit: jest.fn(),
    disabledReasonKey: null,
    attachmentsEnabled: true,
    ...overrides,
  };
  const view = (next: Props) => (
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeComposer {...next} />
    </E2eeTestProvider>
  );
  const rendered = render(view(props));
  return {
    engine,
    input: screen.queryByRole("textbox", { name: "Encrypted message" }),
    rerender: (next: Partial<Props>) =>
      rendered.rerender(view({ ...props, ...next })),
    unmount: rendered.unmount,
  };
}

function chooseGif() {
  fireEvent.click(screen.getByRole("button", { name: "Add GIF" }));
  fireEvent.click(screen.getByRole("button", { name: "Select test GIF" }));
}

beforeEach(() => mockDownload.mockReset());

it("preserves the draft and reply, and sends downloaded bytes as a file without the public URL", async () => {
  const file = gif();
  mockDownload.mockResolvedValue(file);
  const reply = message({ id: "reply-target", text: "Earlier message" });
  const { engine, input } = setup({ replyTo: reply });
  setComposerText(input!, "A private caption");
  fireEvent.click(screen.getByRole("button", { name: "Add GIF" }));
  expect(screen.getByRole("dialog")).toHaveTextContent(
    "GIF searches and previews connect to GIPHY"
  );
  fireEvent.click(screen.getByRole("button", { name: "Select test GIF" }));
  await screen.findByText("giphy.gif");
  expect(engine.send).not.toHaveBeenCalled();
  expect(composerText(input!)).toBe("A private caption");
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await waitFor(() =>
    expect(engine.send).toHaveBeenCalledWith(expect.any(String), {
      text: "A private caption",
      mentions: [],
      reply: reply.id,
      files: [file],
    })
  );
});

it("blocks sending during download and supports cancellation without losing the draft", async () => {
  let resolve!: (file: File) => void;
  mockDownload.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { engine, input } = setup();
  setComposerText(input!, "Keep this draft");
  chooseGif();
  expect(
    screen.getByRole("button", { name: "Send", exact: true })
  ).toBeDisabled();
  const signal = mockDownload.mock.calls[0]![1];
  fireEvent.click(screen.getByRole("button", { name: "Cancel GIF download" }));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(gif()));
  expect(screen.queryByText("giphy.gif")).not.toBeInTheDocument();
  expect(composerText(input!)).toBe("Keep this draft");
  expect(engine.send).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Send", exact: true })
  ).toBeEnabled();
});

it("reports a failed download and allows retry", async () => {
  mockDownload.mockRejectedValueOnce(new GifDownloadError("tooLarge"));
  mockDownload.mockResolvedValueOnce(gif());
  setup();
  chooseGif();
  await screen.findByText(
    "This GIF is larger than 25 MB. Choose a smaller GIF."
  );
  chooseGif();
  await screen.findByText("giphy.gif");
  expect(
    screen.queryByText("This GIF is larger than 25 MB. Choose a smaller GIF.")
  ).not.toBeInTheDocument();
});

it("cancels a download when attachments are switched off", async () => {
  let resolve!: (file: File) => void;
  mockDownload.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const { rerender } = setup();
  chooseGif();
  const signal = mockDownload.mock.calls[0]![1];
  rerender({ attachmentsEnabled: false });
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(gif()));
  expect(screen.queryByText("giphy.gif")).not.toBeInTheDocument();
});

it("aborts an unfinished download when leaving the composer", () => {
  mockDownload.mockReturnValue(new Promise(() => undefined));
  const { unmount } = setup();
  chooseGif();
  const signal = mockDownload.mock.calls[0]![1];
  unmount();
  expect(signal.aborted).toBe(true);
});

it.each([
  { attachmentsEnabled: false },
  { editing: message({ id: "editing", text: "Existing message" }) },
] as Partial<Props>[])(
  "offers no GIF picker when attaching is unavailable: %j",
  (props) => {
    setup(props);
    expect(
      screen.queryByRole("button", { name: "Add GIF" })
    ).not.toBeInTheDocument();
  }
);
