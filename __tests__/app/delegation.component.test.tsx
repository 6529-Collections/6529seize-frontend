import DelegationPage from "@/app/delegation/[...section]/page.client";
import { AuthContext } from "@/components/auth/Auth";
import { DelegationCenterSection } from "@/types/enums";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock(
  "@/components/delegation/DelegationCenterMenu",
  () => (props: any) => (
    <>
      <button
        data-testid="menu"
        onClick={() => props.setActiveSection(DelegationCenterSection.CHECKER)}
      >
        Menu
      </button>
      <button
        data-testid="delegation-center-menu"
        onClick={() => props.setActiveSection(DelegationCenterSection.CENTER)}
      >
        Delegation Center
      </button>
      <span data-testid="address-query">{props.address_query}</span>
    </>
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
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Delegation page component", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

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

  it("does not clear a wallet checker query while navigating away", () => {
    const address = "0x6feea4b5ee60ad140a0d7b0df2d7903ae865456e";
    render(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DelegationPage
          section={DelegationCenterSection.CHECKER}
          addressQuery={address}
          collectionQuery=""
          useCaseQuery={0}
        />
      </AuthContext.Provider>
    );
    replace.mockClear();

    fireEvent.click(screen.getByTestId("delegation-center-menu"));

    expect(push).toHaveBeenCalledWith(
      `/delegation/${DelegationCenterSection.CENTER}`
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("restores wallet checker state from URL props after browser history navigation", () => {
    const address = "0x6feea4b5ee60ad140a0d7b0df2d7903ae865456e";
    const { rerender } = render(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DelegationPage
          section={DelegationCenterSection.CHECKER}
          addressQuery={address}
          collectionQuery=""
          useCaseQuery={0}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("address-query")).toHaveTextContent(address);

    rerender(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DelegationPage
          section={DelegationCenterSection.CENTER}
          addressQuery=""
          collectionQuery=""
          useCaseQuery={0}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("address-query")).toHaveTextContent("");

    rerender(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DelegationPage
          section={DelegationCenterSection.CHECKER}
          addressQuery={address}
          collectionQuery=""
          useCaseQuery={0}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("address-query")).toHaveTextContent(address);
  });
});
