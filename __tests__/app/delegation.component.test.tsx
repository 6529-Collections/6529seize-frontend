import DelegationPage from "@/app/delegation/[...section]/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { DelegationCenterSection } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock(
  "@/components/delegation/DelegationCenterMenu",
  () => (props: any) => (
    <button
      data-testid="menu"
      onClick={() => props.setActiveSection(DelegationCenterSection.CHECKER)}
    >
      Menu
    </button>
  )
);

const push = jest.fn();
const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

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
        <DelegationPage
          section={DelegationCenterSection.CENTER}
          addressQuery=""
          collectionQuery=""
          useCaseQuery={0}
        />
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByTestId("menu"));
    expect(push).toHaveBeenCalledWith(
      `/delegation/${DelegationCenterSection.CHECKER}`
    );
  });
});
