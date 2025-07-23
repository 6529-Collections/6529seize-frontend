import React from "react";
import { render, screen } from "@testing-library/react";
import ReMemes, { generateMetadata } from "@/app/rememes/page";
import { AuthContext } from "@/components/auth/Auth";

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

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/rememes",
}));

describe("ReMemes page", () => {
  it("renders component", () => {
    render(
      <AuthContext.Provider value={{} as any}>
        <ReMemes />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Add ReMeme/)).toBeInTheDocument();
  });

  it("exposes metadata", async () => {
    process.env.BASE_ENDPOINT = "https://test.com";
    const meta = await generateMetadata();
    expect(meta.title).toBe("ReMemes");
    expect(meta.description).toContain("Collections");
    const images = Array.isArray(meta.openGraph?.images)
      ? meta.openGraph?.images
      : [meta.openGraph?.images];
    expect(images?.[0]).toBe(`${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`);
  });
});
