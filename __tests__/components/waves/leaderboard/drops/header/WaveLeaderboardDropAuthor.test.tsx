import { render } from "@testing-library/react";
import { WaveLeaderboardDropAuthorAvatar } from "@/components/waves/leaderboard/drops/header/WaveLeaderboardDropAuthor";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

describe("WaveLeaderboardDropAuthorAvatar", () => {
  it("uses a neutral non-interactive avatar for an anonymous submission", () => {
    const drop = {
      author: {
        is_anonymous: true,
        handle: "alice",
        primary_address: "0x1",
        pfp: CDN_AVATAR_URL,
      },
    } as ExtendedDrop;
    const { container } = render(
      <WaveLeaderboardDropAuthorAvatar drop={drop} />
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    const drop = {
      author: { handle: "alice", primary_address: "0x1", pfp: CDN_AVATAR_URL },
    } as ExtendedDrop;
    const { container } = render(
      <WaveLeaderboardDropAuthorAvatar drop={drop} />
    );
    expect(getRequestedImageSrc(container.querySelector("img"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });
});
