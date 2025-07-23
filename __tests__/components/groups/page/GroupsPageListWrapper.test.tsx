import { render } from "@testing-library/react";
import React from "react";
import GroupsPageListWrapper from "../../../../components/groups/page/GroupsPageListWrapper";
import { AuthContext } from "../../../../components/auth/Auth";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

let listProps: any;
jest.mock(
  "../../../../components/groups/page/list/GroupsList",
  () => (props: any) => {
    listProps = props;
    return <div data-testid="list" />;
  }
);

const replace = jest.fn();
const searchMap = new Map<string, string | null>();

function setupContext(context: any) {
  (useRouter as jest.Mock).mockReturnValue({ replace });
  (usePathname as jest.Mock).mockReturnValue("/groups");
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (k: string) => searchMap.get(k) ?? null,
    toString: () => {
      const params = new URLSearchParams();
      for (const [key, val] of Array.from(searchMap.entries())) {
        if (val !== null) params.set(key, val);
      }
      return params.toString();
    },
  });
  listProps = null;
  replace.mockReset();
  return render(
    <AuthContext.Provider value={context}>
      <GroupsPageListWrapper onCreateNewGroup={jest.fn()} />
    </AuthContext.Provider>
  );
}

describe("GroupsPageListWrapper", () => {
  beforeEach(() => {
    searchMap.clear();
  });

  it("initializes filters and buttons from context and params", () => {
    searchMap.set("group", "test");
    searchMap.set("identity", "bob");
    setupContext({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
    });
    expect(listProps.filters).toEqual({
      group_name: "test",
      author_identity: "bob",
    });
    expect(listProps.showCreateNewGroupButton).toBe(true);
    expect(listProps.showMyGroupsButton).toBe(true);
  });

  it("updates query string when setting group name", () => {
    searchMap.set("identity", "bob");
    setupContext({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
    });
    listProps.setGroupName("new");
    expect(replace).toHaveBeenCalledWith("/groups?identity=bob&group=new");
  });

  it("uses proxy handle when available in onMyGroups", () => {
    setupContext({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: { created_by: { handle: "proxy" } },
    });
    listProps.onMyGroups();
    expect(replace).toHaveBeenCalledWith("/groups?identity=proxy");
  });
});
