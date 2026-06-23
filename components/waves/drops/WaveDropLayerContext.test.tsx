import { render, renderHook } from "@testing-library/react";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ReactNode } from "react";
import WaveDropActions from "./WaveDropActions";
import {
  useWaveDropLayers,
  WaveDropLayerProvider,
} from "./WaveDropLayerContext";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { handle: "alice" } }),
}));

jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ isMemesWave: () => false }),
}));

jest.mock("./WaveDropActionsAddReaction", () => ({
  __esModule: true,
  default: () => <button type="button">add reaction</button>,
}));

jest.mock("./WaveDropActionsBoost", () => ({
  __esModule: true,
  default: () => <button type="button">boost</button>,
}));

jest.mock("./WaveDropActionsCopyLink", () => ({
  __esModule: true,
  default: () => <button type="button">copy link</button>,
}));

jest.mock("./WaveDropActionsMore", () => ({
  __esModule: true,
  default: () => <button type="button">more</button>,
}));

jest.mock("./WaveDropActionsQuickReact", () => ({
  __esModule: true,
  default: () => <button type="button">quick react</button>,
}));

jest.mock("./WaveDropActionsRate", () => ({
  __esModule: true,
  default: () => <button type="button">rate</button>,
}));

jest.mock("./WaveDropActionsReply", () => ({
  __esModule: true,
  default: () => <button type="button">reply</button>,
}));

const drop = {
  id: "drop-1",
  drop_type: ApiDropType.Chat,
  wave: { id: "wave-1" },
  context_profile_context: {},
} as ExtendedDrop;

describe("WaveDropLayerContext", () => {
  it("places desktop actions above boosted drop card internals by default", () => {
    const { result } = renderHook(() => useWaveDropLayers());

    expect(result.current.desktopActionsZIndexClassName).toBe("tw-z-40");
  });

  it("keeps the desktop action layer when only mobile layers are overridden", () => {
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <WaveDropLayerProvider
        value={{
          mobileMenuZIndexClassName: "tw-z-[1020]",
          mobileDialogZIndexClassName: "tw-z-[1030]",
        }}
      >
        {children}
      </WaveDropLayerProvider>
    );

    const { result } = renderHook(() => useWaveDropLayers(), { wrapper });

    expect(result.current.desktopActionsZIndexClassName).toBe("tw-z-40");
    expect(result.current.mobileMenuZIndexClassName).toBe("tw-z-[1020]");
    expect(result.current.mobileDialogZIndexClassName).toBe("tw-z-[1030]");
  });
});

describe("WaveDropActions layer", () => {
  it("uses the default desktop action layer on the hover action wrapper", () => {
    const { container } = render(
      <WaveDropActions drop={drop} activePartIndex={0} onReply={jest.fn()} />
    );

    expect(container.firstElementChild).toHaveClass("tw-z-40");
    expect(container.firstElementChild).not.toHaveClass("tw-z-20");
  });

  it("uses the contextual desktop action layer when provided", () => {
    const { container } = render(
      <WaveDropLayerProvider
        value={{ desktopActionsZIndexClassName: "tw-z-50" }}
      >
        <WaveDropActions drop={drop} activePartIndex={0} onReply={jest.fn()} />
      </WaveDropLayerProvider>
    );

    expect(container.firstElementChild).toHaveClass("tw-z-50");
  });
});
