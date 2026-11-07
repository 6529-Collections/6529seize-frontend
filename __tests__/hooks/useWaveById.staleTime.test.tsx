import QueryClientSetup from "@/components/providers/QueryClientSetup";
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

let now = START;
let client: QueryClient | undefined;

function CaptureClient() {
  client = useQueryClient();
  return null;
}

function WaveName({ staleTime }: { readonly staleTime?: number }) {
  const { wave } = useWaveById(WAVE_ID, {
    ...(staleTime === undefined ? {} : { staleTime }),
  });
  return <span>{wave?.name ?? "loading"}</span>;
}

function renderWave({
  shown,
  staleTime,
}: {
  readonly shown: boolean;
  readonly staleTime?: number;
}) {
  return (
    <QueryClientSetup>
      <CaptureClient />
      {shown ? (
        <WaveName {...(staleTime === undefined ? {} : { staleTime })} />
      ) : null}
    </QueryClientSetup>
  );
}

// The app's QueryClient, with a sidebar observer mounted and loaded once.
async function mountLoadedWave(staleTime?: number) {
  const view = render(
    renderWave({
      shown: true,
      ...(staleTime === undefined ? {} : { staleTime }),
    })
  );
  await screen.findByText("Announcements");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return view;
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

describe("useWaveById stale window", () => {
  it("reuses the cached wave on remount and focus inside the window", async () => {
    const view = await mountLoadedWave(TEN_MINUTES);

    now = START + TEN_MINUTES - 1000;
    view.rerender(renderWave({ shown: false, staleTime: TEN_MINUTES }));
    view.rerender(renderWave({ shown: true, staleTime: TEN_MINUTES }));
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(screen.getByText("Announcements")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches on remount, not on focus, once the window has passed", async () => {
    const view = await mountLoadedWave(TEN_MINUTES);

    now = START + TEN_MINUTES + 1000;
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    view.rerender(renderWave({ shown: false, staleTime: TEN_MINUTES }));
    view.rerender(renderWave({ shown: true, staleTime: TEN_MINUTES }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("keeps the one-minute default for other callers", async () => {
    const view = await mountLoadedWave();

    now = START + 2 * 60 * 1000;
    view.rerender(renderWave({ shown: false }));
    view.rerender(renderWave({ shown: true }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
