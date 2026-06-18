import ReMemes, { generateMetadata } from "@/app/rememes/page";
import { AuthContext } from "@/components/auth/Auth";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import React from "react";

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

jest.mock("next/navigation", () => ({
  redirect: jest.fn((href: string) => {
    throw new Error(`NEXT_REDIRECT:${href}`);
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/rememes",
}));

describe("ReMemes page", () => {
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function renderReMemesPage(searchParams = {}) {
    const page = await ReMemes({
      searchParams: Promise.resolve(searchParams),
    });

    render(
      <AuthContext.Provider value={{} as any}>{page}</AuthContext.Provider>
    );
  }

  it("renders component", async () => {
    await renderReMemesPage();
    expect(screen.getByText(/Add ReMeme/)).toBeInTheDocument();
  });

  it("redirects malformed meme ids away while preserving unrelated params and locale", async () => {
    await expect(
      ReMemes({
        searchParams: Promise.resolve({
          meme_id: "42abc",
          locale: "de-DE",
          utm_source: "newsletter",
        }),
      })
    ).rejects.toThrow(
      "NEXT_REDIRECT:/rememes?utm_source=newsletter&locale=de-DE"
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/rememes?utm_source=newsletter&locale=de-DE"
    );
  });

  it("redirects leading-zero meme ids to their canonical numeric value", async () => {
    await expect(
      ReMemes({
        searchParams: Promise.resolve({
          meme_id: "0042",
          locale: "de-DE",
          utm_source: "newsletter",
        }),
      })
    ).rejects.toThrow(
      "NEXT_REDIRECT:/rememes?utm_source=newsletter&meme_id=42&locale=de-DE"
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/rememes?utm_source=newsletter&meme_id=42&locale=de-DE"
    );
  });

  it("exposes metadata", async () => {
    const meta = await generateMetadata({
      searchParams: Promise.resolve({}),
    });
    expect(meta.title).toBe("ReMemes");
    expect(meta.description).toContain("Collections");
    const images = Array.isArray(meta.openGraph?.images)
      ? meta.openGraph?.images
      : [meta.openGraph?.images];
    expect(images?.[0]).toMatchObject({
      alt: "ReMemes collection social card",
      height: 630,
      url: "https://test.6529.io/api/og-metadata/collections/rememes",
      width: 1200,
    });
  });
});
