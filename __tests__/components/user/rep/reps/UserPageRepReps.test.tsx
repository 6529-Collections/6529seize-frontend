import { render, screen } from "@testing-library/react";
import React from "react";
import UserPageRepReps from "../../../../../components/user/rep/reps/UserPageRepReps";
import { AuthContext } from "../../../../../components/auth/Auth";
import { ApiProfileProxyActionType } from "../../../../../generated/models/ApiProfileProxyActionType";

jest.mock("next/router", () => ({ useRouter: () => ({ isReady: true }) }));

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockReturnValue({ matches, addListener: jest.fn(), removeListener: jest.fn() }),
  });
}

const sampleReps = [
  { category: "a", rating: 5, contributor_count: 2, rater_contribution: 1 },
  { category: "b", rating: 5, contributor_count: 3, rater_contribution: 0 },
  { category: "c", rating: 10, contributor_count: 1, rater_contribution: 0 },
];

const profile = { handle: "target" } as any;

function renderComponent(authValue: any) {
  return render(
    <AuthContext.Provider value={{ ...authValue }}>
      <UserPageRepReps repRates={{ rating_stats: sampleReps } as any} profile={profile} />
    </AuthContext.Provider>
  );
}

describe("UserPageRepReps", () => {
  beforeEach(() => {
    setMatchMedia(false);
  });
  it("sorts reps by rating and contributor count", () => {
    renderComponent({ connectedProfile: null, activeProfileProxy: null });

    const items = screen.getAllByRole("button");
    // first top rep should be rating 10 (category c)
    expect(items[0]).toHaveTextContent("c");
  });

  it("disables editing when viewing own profile", () => {
    renderComponent({ connectedProfile: { handle: "target" }, activeProfileProxy: null });
    const button = screen.getAllByRole("button")[0];
    expect(button).toBeDisabled();
  });

  it("allows editing when proxy has allocate rep action", () => {
    renderComponent({
      connectedProfile: { handle: "me" },
      activeProfileProxy: {
        created_by: { handle: "other" },
        actions: [{ action_type: ApiProfileProxyActionType.AllocateRep }],
      },
    });
    const button = screen.getAllByRole("button")[0];
    expect(button).toBeEnabled();
  });
});
