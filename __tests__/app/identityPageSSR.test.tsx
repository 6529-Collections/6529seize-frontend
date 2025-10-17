import { act, render, screen, waitFor } from "@testing-library/react";
import type { Page as PageWithCount } from "@/helpers/Types";
import type {
  CicStatement,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import type { IdentityTabParams } from "@/app/[user]/identity/_lib/identityTabQueries";
import {
  ProfileActivityFilterTargetType,
  ProfileRatersParamsOrderBy,
  RateMatter,
} from "@/enums";
import { SortDirection } from "@/entities/ISort";
import type { CountlessPage } from "@/helpers/Types";
import type { ProfileActivityLog } from "@/entities/IProfile";

const hydratorPropsSpy = jest.fn();
const layoutPropsSpy = jest.fn();

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/helpers/server.helpers", () => {
  const actual = jest.requireActual("@/helpers/server.helpers");
  return {
    ...actual,
    getUserProfile: jest.fn(),
    userPageNeedsRedirect: jest.fn(),
    getProfileCicStatements: jest.fn(),
    getProfileCicRatings: jest.fn(),
    getUserProfileActivityLogs: jest.fn(),
  };
});

jest.mock("@/components/user/layout/UserPageLayout", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      layoutPropsSpy(props);
      return React.createElement(
        "div",
        { "data-testid": "layout" },
        props.children
      );
    },
  };
});

jest.mock("@/components/user/identity/UserPageIdentityHydrator", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      hydratorPropsSpy(props);
      return React.createElement("div", {
        "data-testid": "identity-hydrator",
      });
    },
  };
});

jest.mock(
  "@/components/user/identity/statements/UserPageIdentityStatements",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props: any) => {
        return React.createElement("div", {
          "data-testid": "identity-statements",
        });
      },
    };
  }
);

jest.mock(
  "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props: any) => {
        if (props.initialParams?.given) {
          return React.createElement("div", {
            "data-testid": "identity-cic-given",
          });
        }
        return React.createElement("div", {
          "data-testid": "identity-cic-received",
        });
      },
    };
  }
);

jest.mock(
  "@/components/user/identity/activity/UserPageIdentityActivityLog",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: (props: any) => {
        return React.createElement("div", {
          "data-testid": "identity-activity",
        });
      },
    };
  }
);

jest.mock(
  "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          "div",
          { "data-testid": "identity-setup" },
          children
        ),
    };
  }
);

import Page, {
  IdentityTabContent,
} from "@/app/[user]/identity/page";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getProfileCicRatings,
  getProfileCicStatements,
  getUserProfile,
  getUserProfileActivityLogs,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

const buildIdentityData = () => {
  const statements = [{ id: "statement-1" }] as CicStatement[];
  const cicGiven: PageWithCount<RatingWithProfileInfoAndLevel> = {
    count: 1,
    data: [{ id: "given-1" } as RatingWithProfileInfoAndLevel],
    page: 1,
    next: false,
  };
  const cicReceived: PageWithCount<RatingWithProfileInfoAndLevel> = {
    count: 2,
    data: [{ id: "received-1" } as RatingWithProfileInfoAndLevel],
    page: 1,
    next: false,
  };
  const activityLog: CountlessPage<ProfileActivityLog> = {
    page: 1,
    next: false,
    data: [{ id: "log-1" } as ProfileActivityLog],
  };
  const params: IdentityTabParams = {
    activityLogParams: {
      page: 1,
      pageSize: 10,
      logTypes: [],
      matter: null,
      targetType: ProfileActivityFilterTargetType.ALL,
      handleOrWallet: "alice",
      groupId: null,
    },
    cicGivenParams: {
      page: 1,
      pageSize: 7,
      given: true,
      order: SortDirection.DESC,
      orderBy: ProfileRatersParamsOrderBy.RATING,
      handleOrWallet: "alice",
      matter: RateMatter.NIC,
    },
    cicReceivedParams: {
      page: 1,
      pageSize: 7,
      given: false,
      order: SortDirection.DESC,
      orderBy: ProfileRatersParamsOrderBy.RATING,
      handleOrWallet: "alice",
      matter: RateMatter.NIC,
    },
  };

  return { statements, cicGiven, cicReceived, activityLog, params };
};

describe("identity page SSR streaming", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prepares layout props while deferring identity data fetches", async () => {
    const headers = { "x-test": "identity" };
    const profile = { handle: null, wallets: [], id: 99 } as any;

    (getAppCommonHeaders as jest.Mock).mockResolvedValue(headers);
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
    (getProfileCicStatements as jest.Mock).mockResolvedValue([]);
    (getProfileCicRatings as jest.Mock).mockResolvedValue({
      count: 0,
      data: [],
      page: 1,
      next: false,
    });
    (getUserProfileActivityLogs as jest.Mock).mockResolvedValue({
      page: 1,
      next: false,
      data: [],
    });

    const element = await Page({
      params: Promise.resolve({ user: "Alice" }),
      searchParams: Promise.resolve({ q: "test" }),
    } as any);

    render(element);

    expect(getUserProfile).toHaveBeenCalledWith({
      user: "alice",
      headers,
    });
    expect(userPageNeedsRedirect).toHaveBeenCalledWith({
      profile,
      req: { query: { user: "Alice", q: "test" } },
      subroute: "identity",
    });
    expect(layoutPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        profile,
        handleOrWallet: "alice",
      })
    );
    expect(screen.getByTestId("identity-tab-fallback")).toBeInTheDocument();
  });

  it("streams identity tab sections independently", async () => {
    const headers = { "x-test": "identity" };
    const profile = { handle: null, wallets: [], id: 99 } as any;
    const { statements, cicGiven, cicReceived, activityLog, params } =
      buildIdentityData();

    (getProfileCicStatements as jest.Mock).mockResolvedValue(statements);
    (getProfileCicRatings as jest.Mock).mockImplementation(
      async ({
        params: ratingsParams,
      }: {
        params: IdentityTabParams["cicGivenParams"];
      }) => (ratingsParams.given ? cicGiven : cicReceived)
    );
    (getUserProfileActivityLogs as jest.Mock).mockResolvedValue(activityLog);

    const content = await IdentityTabContent({
      profile,
      handleOrWallet: "alice",
      headers,
    });

    render(<div>{content}</div>);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getProfileCicStatements).toHaveBeenCalledWith({
      handleOrWallet: "alice",
      headers,
    });

    const ratingsCalls = (getProfileCicRatings as jest.Mock).mock.calls;
    expect(ratingsCalls).toHaveLength(2);
    expect(ratingsCalls[0][0]).toEqual(
      expect.objectContaining({
        handleOrWallet: "alice",
        headers,
        params: params.cicGivenParams,
      })
    );
    expect(ratingsCalls[1][0]).toEqual(
      expect.objectContaining({
        handleOrWallet: "alice",
        headers,
        params: params.cicReceivedParams,
      })
    );

    expect(getUserProfileActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        headers,
      })
    );

    expect(screen.getByTestId("identity-header")).toBeInTheDocument();
    expect(
      screen.getByTestId("identity-raters-skeleton-given")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("identity-raters-skeleton-received")
    ).toBeInTheDocument();
    expect(screen.getAllByText((content, node) => node?.className?.includes?.("tw-animate-pulse")).length).toBeGreaterThan(
      0
    );
  });
});
jest.mock(
  "@/components/user/identity/header/UserPageIdentityHeader",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: () =>
        React.createElement("div", { "data-testid": "identity-header" }),
    };
  }
);
