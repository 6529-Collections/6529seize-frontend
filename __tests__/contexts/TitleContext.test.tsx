import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import {
  TitleProvider,
  useSetWaveData,
  useTitle,
} from "@/contexts/TitleContext";
import { render, screen, waitFor } from "@testing-library/react";

let mockPathname = "/waves/wave-1";
let mockSearchParams = new URLSearchParams("divider=841669");
let mockActiveWaveId: string | null = "wave-1";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () =>
    mockActiveWaveId
      ? {
          activeWave: {
            id: mockActiveWaveId,
            set: jest.fn(),
          },
        }
      : null,
}));

function TitleHarness({
  waveData,
}: {
  readonly waveData: { name: string; newItemsCount: number } | null;
}) {
  useSetWaveData(waveData);
  const { title } = useTitle();
  return <div>{title}</div>;
}

describe("TitleContext", () => {
  beforeEach(() => {
    mockPathname = "/waves/wave-1";
    mockSearchParams = new URLSearchParams("divider=841669");
    mockActiveWaveId = "wave-1";
    document.title = "";
  });

  it("resets the client title when leaving a wave for the meme calendar", async () => {
    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ name: "6529 Dev Daily Standup", newItemsCount: 0 }}
        />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("6529 Dev Daily Standup | Brain")
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("6529 Dev Daily Standup | Brain");
    });

    mockPathname = "/meme-calendar";
    mockSearchParams = new URLSearchParams();

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Memes Minting Calendar")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("Memes Minting Calendar");
    });
  });

  it("resets the client title when the active wave id changes on the same route", async () => {
    mockPathname = "/messages";
    mockSearchParams = new URLSearchParams("wave=wave-1");

    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={{ name: "Wave One", newItemsCount: 0 }} />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Wave One | Brain")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("Wave One | Brain");
    });

    mockSearchParams = new URLSearchParams("wave=wave-2");
    mockActiveWaveId = "wave-2";

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Messages | Brain")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("Messages | Brain");
    });
  });
});
