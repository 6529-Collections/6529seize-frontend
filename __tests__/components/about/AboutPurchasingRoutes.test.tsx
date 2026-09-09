import { render } from "@testing-library/react";
import About from "@/components/about/About";
import { AboutSection } from "@/types/enums";

const mockReplace = jest.fn();
const mockMinting = jest.fn();
const mockSubscriptions = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({
    hideNftPurchasing: true,
    shouldRedirect: true,
  }),
}));
jest.mock("@/components/about/AboutMinting", () => ({
  __esModule: true,
  default: () => {
    mockMinting();
    return <div>Minting</div>;
  },
}));
jest.mock("@/components/about/AboutSubscriptions", () => ({
  __esModule: true,
  default: () => {
    mockSubscriptions();
    return <div>Subscriptions</div>;
  },
}));

it.each([AboutSection.MINTING, AboutSection.SUBSCRIPTIONS])(
  "redirects %s without mounting its content",
  (section) => {
    jest.clearAllMocks();
    const { container } = render(<About section={section} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockMinting).not.toHaveBeenCalled();
    expect(mockSubscriptions).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/about");
  }
);
