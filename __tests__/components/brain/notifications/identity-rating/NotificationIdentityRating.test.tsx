import NotificationIdentityRating from "@/components/brain/notifications/identity-rating/NotificationIdentityRating";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { INotificationIdentityRep } from "@/types/feed.types";
import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

type MockNextLinkProps = ComponentProps<"a"> & {
  readonly prefetch?: boolean | undefined;
};

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ prefetch, ...props }: MockNextLinkProps) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}));

jest.mock("@/components/auth/Auth", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    AuthContext: React.createContext({
      connectedProfile: { handle: "connected-profile" },
    }),
  };
});

jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationHeader",
  () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
  })
);

jest.mock("@/components/brain/notifications/NotificationsFollowBtn", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

describe("NotificationIdentityRating", () => {
  it("keeps the connected profile link without viewport prefetch", () => {
    const notification: INotificationIdentityRep = {
      id: 42,
      cause: ApiNotificationCause.IdentityRep,
      created_at: 1_717_344_000_000,
      read_at: null,
      related_identity: {
        id: "rater-profile",
        handle: "rater",
        pfp: null,
      } as ApiProfileMin,
      additional_context: {
        amount: 1,
        rater_rating: 2,
        total: 3,
        category: "Art",
      },
    };

    render(<NotificationIdentityRating notification={notification} />);

    const profileLink = screen.getByRole("link", {
      name: /REP for Art/i,
    });
    expect(profileLink).toHaveAttribute("href", "/connected-profile");
    expect(profileLink).toHaveAttribute("data-prefetch", "false");
  });
});
