// @ts-nocheck
import MemeGasPage, { generateMetadata } from "@/app/meme-gas/page";
import { AuthContext } from "@/components/auth/Auth";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/components/gas-royalties/Gas", () => () => (
  <div data-testid="gas" />
));

jest.mock("@/styles/Home.module.scss", () => ({
  main: "main-class",
}));

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

describe("MemeGasPage", () => {
  const setTitle = jest.fn();

  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <MemeGasPage />
      </AuthContext.Provider>
    );

  it("renders gas component inside main", async () => {
    const { container } = renderPage();
    expect(container.querySelector("main")).toHaveClass("main-class");
    expect(await screen.findByTestId("gas")).toBeInTheDocument();
  });

  it("page renders successfully", () => {
    renderPage();
    // Component renders successfully
  });

  it("exposes correct metadata", async () => {
    const metadata = await generateMetadata({
      searchParams: { focus: "the-memes" },
    });
    expect(metadata).toMatchObject({
      title: "Meme Gas - The Memes",
      description: "Tools | 6529.io",
    });
  });
});
