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
  readonly waveData: {
    id: string;
    name: string;
    newItemsCount: number;
  } | null;
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
          waveData={{
            id: "wave-1",
            name: "6529 Dev Daily Standup",
            newItemsCount: 0,
          }}
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

    // Across a route change the context leaves document.title to the new
    // route's server metadata commit (jsdom has no App Router, so simulate
    // it: /meme-calendar's metadata title is "Memes Minting Calendar"); the
    // context must not fight it afterwards.
    document.title = "Memes Minting Calendar";
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
        <TitleHarness
          waveData={{ id: "wave-1", name: "Wave One", newItemsCount: 0 }}
        />
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

  it("preserves freshly loaded title data when the wave route changes", async () => {
    mockPathname = "/waves/wave-1";

    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ id: "wave-1", name: "Wave One", newItemsCount: 0 }}
        />
      </TitleProvider>
    );

    await waitFor(() => expect(document.title).toBe("Wave One | Brain"));

    mockPathname = "/waves/wave-2";
    mockActiveWaveId = "wave-2";

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ id: "wave-2", name: "Wave Two", newItemsCount: 2 }}
        />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(document.title).toBe("(2 new messages) Wave Two | Brain")
    );
  });

  it("clears the owned wave title when wave data becomes unavailable", async () => {
    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ id: "wave-1", name: "Wave One", newItemsCount: 4 }}
        />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(document.title).toBe("(4 new messages) Wave One | Brain")
    );

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => expect(document.title).toBe("Waves | Brain"));
  });

  it("restores the waves index title when the selected wave is deselected", async () => {
    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{
            id: "wave-1",
            name: "The Memes - Main Stage",
            newItemsCount: 0,
          }}
        />
      </TitleProvider>
    );

    await waitFor(() =>
      expect(document.title).toBe("The Memes - Main Stage | Brain")
    );

    mockPathname = "/waves";
    mockSearchParams = new URLSearchParams();
    mockActiveWaveId = null;

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => expect(document.title).toBe("Waves | Brain"));
  });

  it("restores the messages index title when the selected DM is deselected", async () => {
    mockPathname = "/messages/dm-1";
    mockActiveWaveId = "dm-1";

    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ id: "dm-1", name: "Alice", newItemsCount: 0 }}
        />
      </TitleProvider>
    );

    await waitFor(() => expect(document.title).toBe("Alice | Brain"));

    mockPathname = "/messages";
    mockSearchParams = new URLSearchParams();
    mockActiveWaveId = null;

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => expect(document.title).toBe("Messages | Brain"));
  });

  it("uses the discovery route title instead of the profile fallback", async () => {
    mockPathname = "/discover";
    mockSearchParams = new URLSearchParams();
    mockActiveWaveId = null;

    render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Discovery")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("Discovery");
    });
  });

  it("restores the default home title after leaving messages", async () => {
    mockPathname = "/messages";
    mockSearchParams = new URLSearchParams("wave=wave-1");

    const view = render(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness
          waveData={{ id: "wave-1", name: "Wave One", newItemsCount: 0 }}
        />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Wave One | Brain")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("Wave One | Brain");
    });

    mockPathname = "/";
    mockSearchParams = new URLSearchParams();
    mockActiveWaveId = null;

    view.rerender(
      <TitleProvider>
        <DynamicHeadTitle />
        <TitleHarness waveData={null} />
      </TitleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("6529.io")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.title).toBe("6529.io");
    });
  });

  it.each([
    ["/drop-forge", "Drop Forge"],
    ["/drop-forge/craft", "Craft Claims"],
    ["/drop-forge/craft/123", "Claim #123 | Craft Claims"],
    ["/drop-forge/launch", "Launch Claims"],
    ["/drop-forge/launch/456", "Claim #456 | Launch Claims"],
  ])(
    "preserves server metadata for %s when the client title is still default",
    async (pathname, expectedTitle) => {
      mockPathname = pathname;
      mockSearchParams = new URLSearchParams();
      mockActiveWaveId = null;
      document.title = expectedTitle;

      render(
        <TitleProvider>
          <DynamicHeadTitle />
        </TitleProvider>
      );

      await waitFor(() => {
        expect(document.title).toBe(expectedTitle);
      });
    }
  );
});
