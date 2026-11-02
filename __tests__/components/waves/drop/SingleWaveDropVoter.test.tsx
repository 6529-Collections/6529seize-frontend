import React from "react";
import { render, screen } from "@testing-library/react";
import { SingleWaveDropVoter } from "@/components/waves/drop/SingleWaveDropVoter";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ImageScale } from "@/helpers/image.helpers";
import {
  CDN_AVATAR_URL,
  getRequestedImageSrc,
  scaledAvatarPath,
} from "@/__tests__/utils/avatarSrc";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("SingleWaveDropVoter", () => {
  const baseVoter = {
    voter: { handle: "0x1111111111111111111111111111111111111111", pfp: null },
    positive_votes_summed: 2,
    negative_votes_summed: 1,
    absolute_votes_summed: 3,
  } as any;

  it("requests the AUTOx50 derivative of a CDN profile picture", () => {
    const { container } = render(
      <SingleWaveDropVoter
        voter={{
          ...baseVoter,
          voter: { ...baseVoter.voter, pfp: CDN_AVATAR_URL },
        }}
        position={1}
        creditType={ApiWaveCreditType.Rep}
      />
    );
    expect(getRequestedImageSrc(container.querySelector("img"))).toContain(
      scaledAvatarPath(ImageScale.W_AUTO_H_50)
    );
  });

  it("renders voter information and totals", () => {
    render(
      <SingleWaveDropVoter
        voter={baseVoter}
        position={1}
        creditType={ApiWaveCreditType.Rep}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(baseVoter.voter.handle)).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: `${baseVoter.voter.handle}: +2 Rep`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: `${baseVoter.voter.handle}: -1 Rep`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        (_content, element) => element?.textContent === "3 Rep Total"
      ).length
    ).toBeGreaterThan(0);
    const handleSpan = screen.getByText(baseVoter.voter.handle)
      .parentElement as HTMLElement;
    expect(handleSpan.className).toContain("tw-inline-block");
    expect(handleSpan.className).toContain("tw-truncate");
  });
});
