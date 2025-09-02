import ProfileActivityLogsItem from "@/components/profile-activity/list/ProfileActivityLogsItem";
import { ProfileActivityLogType } from "@/enums";
import { render } from "@testing-library/react";

jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogRate",
  () => () => <div data-testid="RATE" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogHandle",
  () => () => <div data-testid="HANDLE" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogSocialMedia",
  () => () => <div data-testid="SOCIAL" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogContact",
  () => () => <div data-testid="CONTACT" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogSocialMediaVerificationPost",
  () => () => <div data-testid="SOCIAL_POST" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogClassification",
  () => () => <div data-testid="CLASS" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogBanner",
  () => () => <div data-testid="BANNER" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogPfp",
  () => () => <div data-testid="PFP" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogProfileArchived",
  () => () => <div data-testid="ARCHIVED" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogGeneralStatement",
  () => () => <div data-testid="STATEMENT" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogNFTAccount",
  () => () => <div data-testid="NFT" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogProxy",
  () => () => <div data-testid="PROXY" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogProxyAction",
  () => () => <div data-testid="PROXY_ACTION" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogProxyActionState",
  () => () => <div data-testid="PROXY_ACTION_STATE" />
);
jest.mock(
  "@/components/profile-activity/list/items/ProfileActivityLogProxyActionChange",
  () => () => <div data-testid="PROXY_ACTION_CHANGE" />
);

describe("ProfileActivityLogsItem", () => {
  const base = { type: ProfileActivityLogType.RATING_EDIT } as any;

  it("renders based on type", () => {
    const { rerender } = render(
      <ProfileActivityLogsItem log={{ ...base }} user={null} />
    );
    expect(document.querySelector('[data-testid="RATE"]')).toBeInTheDocument();
    rerender(
      <ProfileActivityLogsItem
        log={{ ...base, type: ProfileActivityLogType.HANDLE_EDIT }}
        user={null}
      />
    );
    expect(
      document.querySelector('[data-testid="HANDLE"]')
    ).toBeInTheDocument();
  });

  it("throws for unknown type", () => {
    expect(() =>
      render(<ProfileActivityLogsItem log={{ type: "x" } as any} user={null} />)
    ).toThrow();
  });
});
