import About from "@/components/about/About";
import DynamicHeadTitle from "@/components/dynamic-head/DynamicHeadTitle";
import { TitleProvider } from "@/contexts/TitleContext";
import { AboutSection } from "@/types/enums";
import { render, waitFor } from "@testing-library/react";

// About.test.tsx mocks the title hook; this suite keeps the real title context
// and the document title writer, so a section change must reach document.title.
let mockPathname = "/about/license";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <nav data-testid="about-contents" />,
}));

jest.mock("@/components/about/AboutMemes", () => ({
  __esModule: true,
  default: () => <div data-testid="about-memes" />,
}));

const renderAbout = (section: AboutSection) => (
  <TitleProvider>
    <DynamicHeadTitle />
    <About section={section} />
  </TitleProvider>
);

describe("About document title", () => {
  afterEach(() => {
    mockPathname = "/about/license";
    document.title = "";
  });

  it("updates document.title when the mounted About page changes section", async () => {
    const { rerender } = render(renderAbout(AboutSection.LICENSE));

    await waitFor(() => expect(document.title).toBe("License | About"));

    mockPathname = "/about/the-memes";
    rerender(renderAbout(AboutSection.MEMES));

    await waitFor(() => expect(document.title).toBe("The Memes | About"));
  });
});
