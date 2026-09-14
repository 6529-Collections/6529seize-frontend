import CollectRulesPanel from "@/components/collect/CollectRulesPanel";
import { render, screen } from "@testing-library/react";

const mockQuery = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockQuery(...args),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "current" },
    isAuthenticated: true,
  }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { COLLECT_RULES: "collect-rules" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-rules-api", () => ({
  fetchCollectRules: jest.fn(),
}));
jest.mock("@/components/collect/CollectRuleCard", () => ({
  __esModule: true,
  default: ({ rule }: { rule: { id: string } }) => <div>{rule.id}</div>,
}));

it("shows the empty state when returned rules belong only to another profile", () => {
  mockQuery.mockReturnValue({
    data: {
      rules: [{ id: "other rule", definition: { profile_id: "other" } }],
    },
  });
  render(<CollectRulesPanel onOperation={jest.fn()} />);
  expect(screen.queryByText("other rule")).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Save a rule from a reviewed set plan to keep its targets and limits here."
    )
  ).toBeInTheDocument();
});

it("renders only the connected profile's rules without the empty message", () => {
  mockQuery.mockReturnValue({
    data: {
      rules: [
        { id: "other rule", definition: { profile_id: "other" } },
        { id: "current rule", definition: { profile_id: "current" } },
      ],
    },
  });
  render(<CollectRulesPanel onOperation={jest.fn()} />);
  expect(screen.getByText("current rule")).toBeInTheDocument();
  expect(screen.queryByText("other rule")).not.toBeInTheDocument();
  expect(
    screen.queryByText(
      "Save a rule from a reviewed set plan to keep its targets and limits here."
    )
  ).not.toBeInTheDocument();
});
