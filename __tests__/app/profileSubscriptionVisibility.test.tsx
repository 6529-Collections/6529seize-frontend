import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import SubscriptionsPage from "@/app/[user]/subscriptions/page";

let mockCountry = "CY";
const mockSubscriptionMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: true }),
}));
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useCookieConsent: () => ({ country: mockCountry }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/app/[user]/_lib/userTabPageFactory", () => ({
  createUserTabPage: ({
    Tab,
  }: {
    Tab: (props: { profile: ApiIdentity }) => ReactNode;
  }) => ({
    Page: () => <Tab profile={{ handle: "prxt0" } as ApiIdentity} />,
  }),
}));
jest.mock("@/components/user/subscriptions/UserPageSubscriptions", () => ({
  __esModule: true,
  default: () => {
    mockSubscriptionMount();
    return <div>Subscription controls</div>;
  },
}));

it("never mounts subscription controls while the profile layout redirects", () => {
  mockCountry = "CY";
  mockSubscriptionMount.mockClear();
  const { container } = render(<SubscriptionsPage />);
  expect(container).toBeEmptyDOMElement();
  expect(mockSubscriptionMount).not.toHaveBeenCalled();
});

it("keeps the US iOS subscription content", () => {
  mockCountry = "US";
  render(<SubscriptionsPage />);
  expect(screen.getByText("Subscription controls")).toBeInTheDocument();
});
