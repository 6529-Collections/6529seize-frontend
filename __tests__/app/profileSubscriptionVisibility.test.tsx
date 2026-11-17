import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import SubscriptionsPage from "@/app/[user]/(profile)/subscriptions/page";

let mockIsIos = true;
const mockSubscriptionMount = jest.fn();

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isIos: mockIsIos }),
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

beforeEach(() => {
  mockIsIos = true;
  mockSubscriptionMount.mockClear();
});

it("never mounts subscription controls while the iOS profile redirects", () => {
  const { container } = render(<SubscriptionsPage />);
  expect(container).toBeEmptyDOMElement();
  expect(mockSubscriptionMount).not.toHaveBeenCalled();
});

it("mounts subscription controls outside the iOS app", () => {
  mockIsIos = false;
  render(<SubscriptionsPage />);
  expect(screen.getByText("Subscription controls")).toBeInTheDocument();
});
