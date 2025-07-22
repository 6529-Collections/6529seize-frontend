import React from "react";
import PrenodesPage, { generateMetadata } from "@/app/network/prenodes/page";
import { render } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);

// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("prenodes page", () => {
  it("renders Prenodes page", () => {
    render(
      <AuthContext.Provider value={{} as any}>
        <PrenodesPage />
      </AuthContext.Provider>
    );
    // Component renders successfully with TitleContext
  });

  it("has correct metadata", async () => {
    process.env.BASE_ENDPOINT = "https://base.test";
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Prenodes");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});
