import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ArtworkShareCopy from "@/components/artwork-share/ArtworkShareCopy";
import { t } from "@/i18n/messages";

const url = "https://6529.io/the-memes/7";
const caption = `Meme #7\nby Artist · The Memes\n${url}`;
const writeText = jest.fn<Promise<void>, [string]>();
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);

function renderCopy(isCaption = false) {
  return render(
    <ArtworkShareCopy
      value={isCaption ? caption : url}
      locale="en-US"
      caption={isCaption}
    />
  );
}

function expectSelectedField(isCaption: boolean) {
  const field = screen.getByRole("textbox", {
    name: t(
      "en-US",
      isCaption ? "artworkShare.captionLabel" : "artworkShare.artworkLink"
    ),
  });
  if (
    !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
  ) {
    throw new TypeError("Expected a selectable text field");
  }
  expect(field).toBeVisible();
  expect(field).toHaveFocus();
  expect(field).toHaveValue(isCaption ? caption : url);
  expect(field).toHaveAttribute("readonly");
  expect(field.selectionStart).toBe(0);
  expect(field.selectionEnd).toBe(field.value.length);
}

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterAll(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

it("keeps the URL visible and selects its complete value on focus", () => {
  renderCopy();
  screen.getByRole("textbox").focus();
  expectSelectedField(false);
});

it("opens and closes the caption with the keyboard", async () => {
  renderCopy(true);
  const disclosure = screen.getByRole("button", {
    name: t("en-US", "artworkShare.captionLabel"),
  });
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

  disclosure.focus();
  await userEvent.keyboard("{Enter}");
  expect(disclosure).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("textbox")).toHaveValue(caption);
  expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
  await userEvent.keyboard("{Enter}");
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("copies the caption without requiring its disclosure to open", async () => {
  renderCopy(true);
  await userEvent.click(screen.getByRole("button", { name: "Copy caption" }));

  expect(writeText).toHaveBeenCalledWith(caption);
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("does not announce success before the clipboard operation completes", async () => {
  let finishCopy!: () => void;
  writeText.mockReturnValue(
    new Promise<void>((resolve) => {
      finishCopy = resolve;
    })
  );
  renderCopy();

  fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
  expect(writeText).toHaveBeenCalledWith(url);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  await act(async () => finishCopy());
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
});

it.each([false, true])(
  "exposes and selects the exact text after clipboard denial (caption: %s)",
  async (isCaption) => {
    writeText.mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );
    renderCopy(isCaption);

    await userEvent.click(
      screen.getByRole("button", {
        name: isCaption ? "Copy caption" : "Copy link",
      })
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      t("en-US", "artworkShare.copyError")
    );
    expectSelectedField(isCaption);
  }
);

it.each([false, true])(
  "offers manual copying when the clipboard API is missing (caption: %s)",
  async (isCaption) => {
    Reflect.deleteProperty(navigator, "clipboard");
    renderCopy(isCaption);

    await userEvent.click(
      screen.getByRole("button", {
        name: isCaption ? "Copy caption" : "Copy link",
      })
    );

    expect(writeText).not.toHaveBeenCalled();
    expectSelectedField(isCaption);
  }
);

it.each([false, true])(
  "selects the fallback again after a second denied copy (caption: %s)",
  async (isCaption) => {
    writeText.mockRejectedValue(new Error("Clipboard blocked"));
    renderCopy(isCaption);
    const copy = screen.getByRole("button", {
      name: isCaption ? "Copy caption" : "Copy link",
    });
    await userEvent.click(copy);
    expectSelectedField(isCaption);
    if (isCaption) {
      await userEvent.click(
        screen.getByRole("button", {
          name: t("en-US", "artworkShare.captionLabel"),
        })
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    }

    await userEvent.click(copy);

    expect(writeText).toHaveBeenCalledTimes(2);
    await waitFor(() => expectSelectedField(isCaption));
  }
);

it("clears denial feedback after a successful retry", async () => {
  writeText.mockRejectedValueOnce(new Error("Clipboard blocked"));
  renderCopy(true);
  const copy = screen.getByRole("button", { name: "Copy caption" });
  await userEvent.click(copy);
  expect(screen.getByRole("status")).toHaveTextContent(
    t("en-US", "artworkShare.copyError")
  );

  await userEvent.click(copy);

  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  expect(screen.getByRole("status")).not.toHaveTextContent(
    t("en-US", "artworkShare.copyError")
  );
});
