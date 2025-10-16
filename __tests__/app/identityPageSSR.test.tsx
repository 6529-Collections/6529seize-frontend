import { render, screen } from "@testing-library/react";
import type { Page as PageWithCount } from "@/helpers/Types";
import type {
  CicStatement,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import type { IdentityTabParams } from "@/app/[user]/identity/_lib/identityTabQueries";
import { ProfileActivityFilterTargetType, ProfileRatersParamsOrderBy, RateMatter } from "@/enums";
import { SortDirection } from "@/entities/ISort";

const hydratorPropsSpy = jest.fn();
const wrapperPropsSpy = jest.fn();
const layoutPropsSpy = jest.fn();

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

jest.mock("@/helpers/server.helpers", () => ({
  getUserProfile: jest.fn(),
  userPageNeedsRedirect: jest.fn(),
}));

jest.mock("@/app/[user]/identity/_lib/identityTabQueries", () => {
  const actual = jest.requireActual<
    typeof import("@/app/[user]/identity/_lib/identityTabQueries")
  >("@/app/[user]/identity/_lib/identityTabQueries");
  return {
    ...actual,
    fetchIdentityTabData: jest.fn(),
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

jest.mock("@/components/user/identity/UserPageIdentityWrapper", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      wrapperPropsSpy(props);
      return React.createElement("div", {
        "data-testid": "identity-wrapper",
      });
    },
  };
});

import Page from "@/app/[user]/identity/page";
import { fetchIdentityTabData } from "@/app/[user]/identity/_lib/identityTabQueries";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import {
  getUserProfile,
  userPageNeedsRedirect,
} from "@/helpers/server.helpers";

describe("identity page SSR prepare hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefetches server data and passes it into layout, hydrator, and wrapper", async () => {
    const headers = { "x-test": "identity" };
    const profile = {
      handle: null,
      wallets: [],
    } as any;
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
        given: false,
        order: SortDirection.DESC,
        orderBy: ProfileRatersParamsOrderBy.RATING,
        handleOrWallet: "alice",
        matter: RateMatter.NIC,
      },
      cicReceivedParams: {
        page: 1,
        pageSize: 7,
        given: true,
        order: SortDirection.DESC,
        orderBy: ProfileRatersParamsOrderBy.RATING,
        handleOrWallet: "alice",
        matter: RateMatter.NIC,
      },
    };

    (getAppCommonHeaders as jest.Mock).mockResolvedValue(headers);
    (getUserProfile as jest.Mock).mockResolvedValue(profile);
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(null);
    (fetchIdentityTabData as jest.Mock).mockResolvedValue({
      handleOrWallet: "alice",
      params,
      data: {
        statements,
        activityLog: null,
        cicGiven,
        cicReceived,
      },
      cache: {
        revalidateSeconds: 60,
        tags: [
          "identity:alice",
          "identity:alice:statements",
          "identity:alice:raters:given",
          "identity:alice:raters:received",
        ],
      },
      errors: [],
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
    expect(fetchIdentityTabData).toHaveBeenCalledWith({
      handleOrWallet: "alice",
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
        initialStatements: statements,
      })
    );

    expect(hydratorPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        profile,
        handleOrWallet: "alice",
        initialStatements: statements,
        initialActivityLogParams: params.activityLogParams,
        initialActivityLogData: undefined,
        initialCICGivenParams: params.cicGivenParams,
        initialCicGivenData: cicGiven,
        initialCICReceivedParams: params.cicReceivedParams,
        initialCicReceivedData: cicReceived,
      })
    );

    expect(wrapperPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        profile,
        handleOrWallet: "alice",
        initialStatements: statements,
        initialCICGivenParams: params.cicGivenParams,
        initialCICReceivedParams: params.cicReceivedParams,
        initialActivityLogParams: params.activityLogParams,
        initialCicGivenData: cicGiven,
        initialCicReceivedData: cicReceived,
        initialActivityLogData: undefined,
      })
    );

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(
      screen.getByTestId("identity-hydrator")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("identity-wrapper")
    ).toBeInTheDocument();
  });
});
