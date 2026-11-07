import QueryClientSetup from "@/components/providers/QueryClientSetup";
import { useAnnouncementsWave } from "@/hooks/useAnnouncementsWave";
import { useWaveById } from "@/hooks/useWaveById";
import { commonApiFetch } from "@/services/api/common-api";
import {
  focusManager,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

const WAVE_ID = "announcements";
const TEN_MINUTES = 10 * 60 * 1000;
const START = 1_700_000_000_000;

type Reader = "announcements" | "default";

let now = START;
let client: QueryClient | undefined;

function CaptureClient() {
  client = useQueryClient();
  return null;
}

function AnnouncementsWaveName() {
  const { wave } = useAnnouncementsWave(WAVE_ID, true);
  return <span>{wave?.name ?? "loading"}</span>;
}

function DefaultWaveName() {
  const { wave } = useWaveById(WAVE_ID);
  return <span>{wave?.name ?? "loading"}</span>;
}

// The app's QueryClient, with or without one observer of the wave.
function renderWave(reader: Reader, shown: boolean) {
  let observer = null;
  if (shown) {
    observer =
      reader === "announcements" ? (
        <AnnouncementsWaveName />
      ) : (
        <DefaultWaveName />
      );
  }
  return (
    <QueryClientSetup>
      <CaptureClient />
      {observer}
    </QueryClientSetup>
  );
}

async function mountLoadedWave(reader: Reader) {
  const view = render(renderWave(reader, true));
  await screen.findByText("Announcements");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return view;
}

function remount(view: ReturnType<typeof render>, reader: Reader) {
  view.rerender(renderWave(reader, false));
  view.rerender(renderWave(reader, true));
}

function refocusWindow() {
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
}

beforeEach(() => {
  now = START;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ id: WAVE_ID, name: "Announcements" } as never);
});

afterEach(() => {
  focusManager.setFocused(undefined);
  client?.clear();
  client = undefined;
  jest.restoreAllMocks();
});

describe("useAnnouncementsWave", () => {
  it("reuses the cached wave on remount and focus for ten minutes", async () => {
    const view = await mountLoadedWave("announcements");

    now = START + TEN_MINUTES - 1000;
    remount(view, "announcements");
    refocusWindow();

    expect(screen.getByText("Announcements")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: `waves/${WAVE_ID}` })
    );
  });

  it("refetches on remount, not on focus, after ten minutes", async () => {
    const view = await mountLoadedWave("announcements");

    now = START + TEN_MINUTES + 1000;
    refocusWindow();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    remount(view, "announcements");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("leaves other wave readers on the one-minute default", async () => {
    const view = await mountLoadedWave("default");

    now = START + 2 * 60 * 1000;
    remount(view, "default");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
