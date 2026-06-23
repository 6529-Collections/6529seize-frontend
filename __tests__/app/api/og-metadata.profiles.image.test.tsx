jest.mock("@/config/env", () => ({
  publicEnv: {
    BASE_ENDPOINT: "https://6529.test",
  },
}));

import { renderProfileOgImage } from "@/app/api/og-metadata/profiles/[identity]/image";
import React from "react";

const collectImageSrcs = (node: React.ReactNode): string[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as {
    readonly src?: string | undefined;
    readonly children?: React.ReactNode;
  };
  const current = typeof props.src === "string" ? [props.src] : [];
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectImageSrcs(child)
  );

  return [...current, ...children];
};

const collectTextNodes = (node: React.ReactNode): string[] => {
  if (typeof node === "string" || typeof node === "number") {
    return [`${node}`];
  }

  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as {
    readonly children?: React.ReactNode;
  };

  return React.Children.toArray(props.children).flatMap((child) =>
    collectTextNodes(child)
  );
};

const collectActivityBadgeTypes = (node: React.ReactNode): string[] => {
  if (!React.isValidElement(node)) {
    return [];
  }

  const props = node.props as {
    readonly children?: React.ReactNode;
    readonly type?: string | undefined;
  };
  const componentType = node.type as { readonly name?: string } | string;
  const isActivityBadge =
    typeof componentType !== "string" &&
    componentType.name === "ArtistActivityBadge";
  const current =
    isActivityBadge && typeof props.type === "string" ? [props.type] : [];
  const children = React.Children.toArray(props.children).flatMap((child) =>
    collectActivityBadgeTypes(child)
  );

  return [...current, ...children];
};

const createProfile = (overrides: Record<string, unknown> = {}) => ({
  id: "profile-1",
  handle: "phoebeum",
  profile_enabled_at: 1695634736000,
  classification: "PSEUDONYM" as any,
  followers_count: 2,
  cic: -20,
  rep: 5008,
  level: 12,
  tdh: 11107,
  ...overrides,
});

describe("renderProfileOgImage", () => {
  it("normalizes profile media through the OG image proxy", () => {
    const element = renderProfileOgImage({
      identity: "prxt0",
      origin: "http://localhost:3001",
      profile: {
        id: "profile-1",
        handle: "prxt0",
        profile_enabled_at: 1695634736000,
        classification: "PSEUDONYM" as any,
        followers_count: 5,
        cic: -8,
        rep: 742,
        level: 76,
        tdh: 5528228,
        media: [
          {
            url: "https://cdn.test/avatar.WEBP",
          },
        ],
        banner: {
          primary: null,
          secondary: "#d30d0d",
          media: [
            {
              url: "https://cdn.test/banner.gif",
            },
          ],
        },
      },
    });

    const srcs = collectImageSrcs(element);

    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Favatar.WEBP&w=274"
    );
    expect(srcs).toContain(
      "http://localhost:3001/api/og-metadata/image?url=https%3A%2F%2Fcdn.test%2Fbanner.gif&w=1200"
    );
    expect(srcs).toContain("https://6529.test/6529.svg");
  });

  it("does not render an avatar placeholder when profile media is missing", () => {
    const element = renderProfileOgImage({
      identity: "phoebeum",
      profile: createProfile(),
    });

    expect(collectTextNodes(element)).not.toContain("P");
  });

  it("adds an ellipsis when the profile description is truncated", () => {
    const element = renderProfileOgImage({
      identity: "phoebeum",
      profile: createProfile({
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus dictum sem et lacus blandit, at lobortis massa tincidunt. Integer vehicula auctor auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus.",
      }),
    });

    expect(collectTextNodes(element)).toContain(
      "lobortis massa tincidunt. Integer vehicula auctor..."
    );
  });

  it("renders the winning activity badge when the profile has winning submissions", () => {
    const element = renderProfileOgImage({
      identity: "phoebeum",
      profile: createProfile({
        has_active_submissions: true,
        has_winning_submissions: true,
      }),
    });

    expect(collectActivityBadgeTypes(element)).toEqual(["winning"]);
  });

  it("renders the active activity badge only when there are active submissions without winners", () => {
    const element = renderProfileOgImage({
      identity: "phoebeum",
      profile: createProfile({
        has_active_submissions: true,
        has_winning_submissions: false,
      }),
    });

    expect(collectActivityBadgeTypes(element)).toEqual(["active"]);
  });

  it("omits the activity badge when the profile has no active or winning submissions", () => {
    const element = renderProfileOgImage({
      identity: "phoebeum",
      profile: createProfile({
        has_active_submissions: false,
        has_winning_submissions: false,
      }),
    });

    expect(collectActivityBadgeTypes(element)).toEqual([]);
  });
});
