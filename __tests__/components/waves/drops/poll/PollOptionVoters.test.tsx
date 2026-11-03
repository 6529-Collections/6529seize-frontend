import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { PollOptionVoters } from "@/components/waves/drops/poll/PollOptionVoters";
import type { ApiDropPollOption } from "@/generated/models/ApiDropPollOption";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/hooks/useDropPollOptionVoters", () => ({
  useDropPollOptionVoters: () => ({
    voters: [
      {
        id: "v1",
        handle: "alice",
        primary_address: "0x1",
        pfp: CDN_AVATAR_URL,
      },
    ],
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isLoading: false,
    isFetchingNextPage: false,
    isError: false,
  }),
}));

describe("PollOptionVoters", () => {
  it("requests the AUTOx50 derivative for voter avatars", () => {
    render(
      <PollOptionVoters
        dropId="drop-1"
        option={{ option_no: 1, votes: 1 } as ApiDropPollOption}
        enabled
      />
    );
    expect(
      getRequestedImageSrc(screen.getByAltText("alice's avatar"))
    ).toContain(scaledAvatarPath(ImageScale.W_AUTO_H_50));
  });
});
