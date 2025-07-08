import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import DelegationPage from "@/pages/delegation/[...section]";
import { DelegationCenterSection } from "@/components/delegation/DelegationCenterMenu";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("next/dynamic", () => () => (props: any) => (
  <button
    data-testid="menu"
    onClick={() => props.setActiveSection(DelegationCenterSection.CHECKER)}>
    Menu
  </button>
));

const push = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push }) }));

window.scrollTo = jest.fn();

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Delegation page component", () => {
  it("calls router push when active section changes", () => {
    render(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DelegationPage section={DelegationCenterSection.CENTER} />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByTestId("menu"));
    expect(push).toHaveBeenCalledWith({
      pathname: `/delegation/${DelegationCenterSection.CHECKER}`,
      query: {},
    });
  });
});
