import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SingleWaveDropShare from "@/components/waves/drop/SingleWaveDropShare";
import { canUseSystemShare } from "@/components/header/share/header-share/shareUtils";
import { showAppToast } from "@/components/utils/toast/AppToast";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://6529.io" },
}));
jest.mock("@capacitor/core", () => ({
  ...jest.requireActual("@capacitor/core"),
  Capacitor: { isNativePlatform: jest.fn() },
}));
jest.mock("@capacitor/share", () => ({
  Share: { canShare: jest.fn(), share: jest.fn() },
}));
jest.mock("@/components/header/share/header-share/shareUtils", () => ({
  canUseSystemShare: jest.fn(),
}));
jest.mock("@/components/utils/toast/AppToast", () => ({
  showAppToast: jest.fn(),
}));

const writeText = jest.fn<Promise<void>, [string]>();
const webShare = jest.fn<Promise<void>, [ShareData]>();
const drop = {
  id: "drop-1",
  wave: { id: "wave-1" },
  serial_no: 42,
  drop_type: ApiDropType.Participatory,
} as ApiDrop;
const wave = { id: "wave-1", chat: { scope: { group: null } } } as ApiWave;

function clickShare() {
  fireEvent.click(screen.getByRole("button", { name: "Share drop" }));
}

beforeEach(() => {
  jest.resetAllMocks();
  writeText.mockResolvedValue(undefined);
  webShare.mockResolvedValue(undefined);
  jest.mocked(Share.canShare).mockResolvedValue({ value: true });
  jest.mocked(Share.share).mockResolvedValue({});
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: webShare,
  });
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["en-US"],
  });
});

it.each([
  ["memes", ApiDropType.Participatory],
  ["quorum", ApiDropType.Participatory],
  ["wave-1", ApiDropType.Participatory],
  ["memes", ApiDropType.Chat],
  ["quorum", ApiDropType.Winner],
])(
  "copies a link that reopens the detail for %s %s",
  async (waveId, dropType) => {
    render(
      <SingleWaveDropShare
        drop={{
          ...drop,
          wave: { ...drop.wave, id: waveId },
          drop_type: dropType,
        }}
        wave={{ ...wave, id: waveId }}
      />
    );
    clickShare();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copied!")
    );
    expect(writeText).toHaveBeenCalledWith(
      `https://6529.io/waves/${waveId}?drop=drop-1`
    );
    expect(webShare).not.toHaveBeenCalled();
  }
);

it("keeps direct-message links on the messages route and shares only the URL", async () => {
  jest.mocked(canUseSystemShare).mockReturnValue(true);
  const dmWave = {
    ...wave,
    chat: { ...wave.chat, scope: { group: { is_direct_message: true } } },
  } as ApiWave;
  render(<SingleWaveDropShare drop={drop} wave={dmWave} />);
  clickShare();
  await waitFor(() =>
    expect(webShare).toHaveBeenCalledWith({
      url: "https://6529.io/messages/wave-1?drop=drop-1",
    })
  );
  expect(writeText).not.toHaveBeenCalled();
});

it("shares through the browser and reports success", async () => {
  jest.mocked(canUseSystemShare).mockReturnValue(true);
  render(<SingleWaveDropShare drop={drop} wave={wave} />);
  clickShare();
  expect(canUseSystemShare).toHaveBeenCalledWith({
    url: "https://6529.io/waves/wave-1?drop=drop-1",
  });
  await waitFor(() =>
    expect(showAppToast).toHaveBeenCalledWith({
      type: "success",
      title: "Link shared",
    })
  );
  expect(writeText).not.toHaveBeenCalled();
});

it("uses Capacitor in the app and prevents duplicate shares while pending", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  let finishShare!: () => void;
  jest.mocked(Share.share).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishShare = () => resolve({});
      })
  );
  render(<SingleWaveDropShare drop={drop} wave={wave} />);
  clickShare();
  await waitFor(() => expect(Share.share).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Share drop" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Share drop" })).toHaveAttribute(
    "aria-busy",
    "true"
  );
  clickShare();
  expect(Share.share).toHaveBeenCalledTimes(1);
  await act(async () => finishShare());
  expect(screen.getByRole("button", { name: "Share drop" })).toBeEnabled();
  expect(webShare).not.toHaveBeenCalled();
  expect(writeText).not.toHaveBeenCalled();
});

it.each([false, true])(
  "copies when sharing fails (native: %s)",
  async (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    jest.mocked(canUseSystemShare).mockReturnValue(true);
    webShare.mockRejectedValue(
      new DOMException("Not allowed", "NotAllowedError")
    );
    jest.mocked(Share.share).mockRejectedValue(new Error("Share unavailable"));
    render(<SingleWaveDropShare drop={drop} wave={wave} />);
    clickShare();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copied!")
    );
    expect(showAppToast).not.toHaveBeenCalled();
  }
);

it.each(["unsupported", "capability check failed"])(
  "copies if native sharing is %s",
  async (reason) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    if (reason === "unsupported")
      jest.mocked(Share.canShare).mockResolvedValue({ value: false });
    else
      jest.mocked(Share.canShare).mockRejectedValue(new Error("Unavailable"));
    render(<SingleWaveDropShare drop={drop} wave={wave} />);
    clickShare();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copied!")
    );
    expect(Share.share).not.toHaveBeenCalled();
  }
);

it.each([
  [false, new DOMException("Share cancelled", "AbortError")],
  [true, { message: "Share canceled" }],
  [true, { code: "SHARE_CANCELED", message: "User cancelled sharing" }],
])(
  "treats cancelling the sheet as a non-event (native: %s)",
  async (native, error) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    jest.mocked(canUseSystemShare).mockReturnValue(true);
    webShare.mockRejectedValue(error);
    jest.mocked(Share.share).mockRejectedValue(error);
    render(<SingleWaveDropShare drop={drop} wave={wave} />);
    clickShare();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Share drop" })).toBeEnabled()
    );
    expect(writeText).not.toHaveBeenCalled();
    expect(showAppToast).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  }
);

it.each(["missing", "denied"])(
  "reports %s clipboard access without false success",
  async (reason) => {
    if (reason === "missing")
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    else
      writeText.mockRejectedValue(
        new DOMException("Denied", "NotAllowedError")
      );
    render(<SingleWaveDropShare drop={drop} wave={wave} />);
    clickShare();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copy failed")
    );
    expect(showAppToast).not.toHaveBeenCalled();
  }
);

it("stays busy until clipboard copying finishes and keeps its accessible name", async () => {
  let finishCopy!: () => void;
  writeText.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishCopy = resolve;
      })
  );
  render(<SingleWaveDropShare drop={drop} wave={wave} />);
  clickShare();
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  const button = screen.getByRole("button", { name: "Share drop" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  clickShare();
  expect(writeText).toHaveBeenCalledTimes(1);
  await act(async () => finishCopy());
  expect(screen.getByRole("status")).toHaveTextContent("Copied!");
  expect(button).toHaveAccessibleName("Share drop");
  expect(button).toBeEnabled();
  expect(button).toHaveAttribute("aria-busy", "false");
});

it.each(["temp-123", "", "   "])("omits an unshareable drop %s", (id) => {
  render(<SingleWaveDropShare drop={{ ...drop, id }} wave={wave} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it.each<[SupportedLocale, string]>([
  ["en-US", "Link shared"],
  ["en-GB", "Link shared"],
  ["fr-FR", "Lien partagé"],
  ["es-ES", "Enlace compartido"],
  ["de-DE", "Link geteilt"],
])(
  "localizes the action and feedback in %s",
  async (locale, sharedMessage) => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: [locale],
    });
    render(<SingleWaveDropShare drop={drop} wave={wave} />);
    const button = screen.getByRole("button", {
      name: t(locale, "singleDrop.shareLabel"),
    });
    expect(button).toHaveTextContent(t(locale, "singleDrop.share"));
    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        t(locale, "waves.drop.actions.copied")
      )
    );
    jest.mocked(canUseSystemShare).mockReturnValue(true);
    fireEvent.click(button);
    await waitFor(() =>
      expect(showAppToast).toHaveBeenCalledWith({
        type: "success",
        title: sharedMessage,
      })
    );
  }
);
