import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { WaveCompetitionPreviewModalContent } from "@/components/waves/drops/WaveCompetitionPreviewModalContent";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-1",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

jest.mock("@headlessui/react", () => ({
  DialogTitle: ({ children }: { readonly children: ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

jest.mock("@/components/waves/drops/WaveCompetitionEntries", () => ({
  WaveCompetitionEntries: () => null,
}));

describe("WaveCompetitionPreviewModalContent", () => {
  it("requests the AUTOx50 derivative of the artist profile picture", () => {
    const { container } = render(
      <WaveCompetitionPreviewModalContent
        user={{ handle: "artist", pfp: CDN_AVATAR_URL } as ApiProfileMin}
        wave={{ id: "wave-1" } as ApiWaveMin}
        hasActiveEntries
        hasWinningEntries={false}
        isOpen
        onClose={jest.fn()}
        isApp={false}
        activeTab="active"
        onTabChange={jest.fn()}
      />
    );
    expect(getRequestedImageSrc(container.querySelector("img"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });
});
