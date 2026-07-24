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

  it("resuming a draft then editing updates it in place, no duplicate", async () => {
    // Seed a draft and resume it in the same session (no reload). Editing
    // afterward must update that same id, not fork a second draft.
    const existing = {
      id: "existing-draft-id",
      updatedAt: 1,
      config: makeConfig("Existing"),
      endDateConfig,
    } as unknown as Parameters<typeof result.current.loadDraft>[0];
    const { result, rerender } = renderHook(
      (props) => useCreateWaveDrafts(props),
      {
        initialProps: {
          config: makeConfig("Existing"),
          endDateConfig,
          step: CreateWaveStep.OVERVIEW,
        },
      }
    );

    act(() => result.current.loadDraft(existing));
    // Edit while still off Overview (loading arms tracking).
    rerender({
      config: makeConfig("Existing edited"),
      endDateConfig,
      step: CreateWaveStep.GROUPS,
    });

    await waitFor(
      () => {
        const drafts = readCreateWaveDrafts();
        expect(drafts).toHaveLength(1);
        expect(drafts[0]!.id).toBe("existing-draft-id");
      },
      { timeout: 2000 }
    );
    expect(readCreateWaveDrafts()[0]!.config.overview.name).toBe(
      "Existing edited"
    );
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
