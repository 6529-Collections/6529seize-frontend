import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  createElement,
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { E2eeImageGallery } from "@/components/e2ee/conversation/E2eeImageGallery";
import { E2eeImageMedia } from "@/components/e2ee/conversation/E2eeImageMedia";
import { downloadMediaUrl } from "@/helpers/media-download.helpers";

let mockIsCapacitor = false;
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsCapacitor }),
}));
jest.mock("@/helpers/media-download.helpers", () => ({
  ...jest.requireActual("@/helpers/media-download.helpers"),
  downloadMediaUrl: jest.fn(async () => undefined),
}));
jest.mock("@/hooks/useInView", () => ({ useInView: () => [jest.fn(), true] }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("@/hooks/useFullScreenSupported", () => ({
  useFullScreenSupported: () => true,
}));
jest.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({ children }: { children: () => ReactNode }) => children(),
  TransformComponent: ({ children }: { children: ReactNode }) => children,
}));
type ImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean;
  readonly unoptimized?: boolean;
};
jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, ImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized, ...props }, ref) =>
      createElement("img", {
        ...props,
        ref,
        "data-unoptimized": String(unoptimized),
      })
  ),
}));

const props = {
  url: "blob:https://6529.io/local-photo",
  name: "photo.png",
  attachment: {
    blob: "encrypted-blob-id",
    name: "photo.png",
    size: 1024,
    mime: "image/png",
    width: 16,
    height: 16,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsCapacitor = false;
});

it("uses the ordinary popup and toolbar without sending decrypted images to an optimizer", async () => {
  render(<E2eeImageMedia {...props} />);
  const trigger = screen.getByRole("button", {
    name: "Open image preview: photo.png",
  });
  act(() => trigger.focus());
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Expanded image preview" });
  expect(within(dialog).getByRole("img")).toHaveAttribute("src", props.url);
  expect(within(dialog).getByRole("img")).toHaveAttribute(
    "data-unoptimized",
    "true"
  );
  expect(within(dialog).queryByText("Retry preview")).not.toBeInTheDocument();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Download media" })
  );
  await waitFor(() =>
    expect(downloadMediaUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: props.url,
        fileName: "photo.png",
        isCapacitor: false,
      })
    )
  );
  fireEvent.keyDown(globalThis.window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it("opens the local image in a new desktop tab", () => {
  const open = jest.spyOn(globalThis.window, "open").mockReturnValue(null);
  render(<E2eeImageMedia {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Open image preview: photo.png" })
  );
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Open in new tab",
    })
  );
  expect(open).toHaveBeenCalledWith(props.url, "_blank", "noopener,noreferrer");
  open.mockRestore();
});

it("saves decrypted images through the native sharing path without offering an external blob link", async () => {
  mockIsCapacitor = true;
  render(<E2eeImageMedia {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Open image preview: photo.png" })
  );
  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).queryByRole("button", { name: "Open in browser" })
  ).not.toBeInTheDocument();
  expect(
    within(dialog).queryByRole("button", { name: "Full screen" })
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Download media" })
  );
  await waitFor(() =>
    expect(downloadMediaUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: props.url,
        fileName: "photo.png",
        isCapacitor: true,
      })
    )
  );
});

it.each([false, true])(
  "keeps gallery order and filenames (native: %s)",
  async (native) => {
    mockIsCapacitor = native;
    const other = {
      ...props,
      url: "blob:https://6529.io/second-photo",
      name: "second.png",
      attachment: {
        ...props.attachment,
        blob: "other-blob",
        name: "second.png",
      },
    };
    render(
      <E2eeImageGallery attachments={[props.attachment, other.attachment]}>
        <E2eeImageMedia {...other} />
        <E2eeImageMedia {...props} />
      </E2eeImageGallery>
    );
    const trigger = screen.getByRole("button", {
      name: "Open image preview: photo.png",
    });
    act(() => trigger.focus());
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    if (native) {
      expect(
        within(dialog).queryByRole("button", { name: "Open in browser" })
      ).not.toBeInTheDocument();
    }
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", props.url);
    fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", other.url);
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "data-unoptimized",
      "true"
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Download media" })
    );
    await waitFor(() =>
      expect(downloadMediaUrl).toHaveBeenCalledWith(
        expect.objectContaining({ url: other.url, fileName: "second.png" })
      )
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Previous image" })
    );
    expect(within(dialog).getByRole("img")).toHaveAttribute("src", props.url);
    fireEvent.keyDown(globalThis.window, { key: "Escape" });
    expect(trigger).toHaveFocus();
  }
);
