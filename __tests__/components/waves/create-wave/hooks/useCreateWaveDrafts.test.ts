import { act, renderHook, waitFor } from "@testing-library/react";
import { useCreateWaveDrafts } from "@/components/waves/create-wave/hooks/useCreateWaveDrafts";
import { CreateWaveStep } from "@/types/waves.types";
import type { CreateWaveConfig } from "@/types/waves.types";
import { readCreateWaveDrafts } from "@/helpers/waves/create-wave-draft.helpers";

const makeConfig = (name: string): CreateWaveConfig =>
  ({
    overview: { type: "CHAT", name, image: null },
  }) as unknown as CreateWaveConfig;

const endDateConfig = { time: null, period: null };

describe("useCreateWaveDrafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not save while still on the Overview step", async () => {
    const { rerender } = renderHook((props) => useCreateWaveDrafts(props), {
      initialProps: {
        config: makeConfig("My Wave"),
        endDateConfig,
        step: CreateWaveStep.OVERVIEW,
      },
    });

    rerender({
      config: makeConfig("My Wave typed more"),
      endDateConfig,
      step: CreateWaveStep.OVERVIEW,
    });

    // Give the debounce window a chance; nothing should persist.
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(readCreateWaveDrafts()).toHaveLength(0);
  });

  it("saves once the flow leaves Overview with a named wave", async () => {
    const { rerender } = renderHook((props) => useCreateWaveDrafts(props), {
      initialProps: {
        config: makeConfig("My Wave"),
        endDateConfig,
        step: CreateWaveStep.OVERVIEW,
      },
    });

    rerender({
      config: makeConfig("My Wave"),
      endDateConfig,
      step: CreateWaveStep.GROUPS,
    });

    await waitFor(() => expect(readCreateWaveDrafts()).toHaveLength(1), {
      timeout: 2000,
    });
    expect(readCreateWaveDrafts()[0]!.config.overview.name).toBe("My Wave");
  });

  it("clears the active draft after a successful create", async () => {
    const { result, rerender } = renderHook(
      (props) => useCreateWaveDrafts(props),
      {
        initialProps: {
          config: makeConfig("My Wave"),
          endDateConfig,
          step: CreateWaveStep.OVERVIEW,
        },
      }
    );

    // Leaving Overview arms autosave and persists the draft.
    rerender({
      config: makeConfig("My Wave"),
      endDateConfig,
      step: CreateWaveStep.GROUPS,
    });
    await waitFor(() => expect(readCreateWaveDrafts()).toHaveLength(1), {
      timeout: 2000,
    });

    act(() => result.current.clearActiveDraft());
    // A cleared draft must not immediately re-save while the flow lingers
    // on a later step (before navigation unmounts the form).
    rerender({
      config: makeConfig("My Wave edited after create"),
      endDateConfig,
      step: CreateWaveStep.GROUPS,
    });

    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(readCreateWaveDrafts()).toHaveLength(0);
  });
});
