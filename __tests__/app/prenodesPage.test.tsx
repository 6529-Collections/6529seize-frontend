import PrenodesPage, { generateMetadata } from "@/app/network/prenodes/page";
import { AuthContext } from "@/components/auth/Auth";
import { render } from "@testing-library/react";
import React from "react";

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
  });

  it("has correct metadata", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toEqual("Prenodes");
    expect(metadata.description).toEqual("Network | 6529.io");
  });
});
