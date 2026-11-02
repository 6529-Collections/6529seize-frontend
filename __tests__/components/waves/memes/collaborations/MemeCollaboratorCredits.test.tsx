import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemeCollaboratorCredits } from "@/components/waves/memes/collaborations/MemeCollaboratorCredits";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  UserCICAndLevelSize: { SMALL: "SMALL" },
  default: ({ level }: { level: number }) => <span>Level {level}</span>,
}));
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: ({
    profile,
    size,
  }: {
    profile: { id: string };
    size: string;
  }) => (
    <span>
      Badges {profile.id} {size}
    </span>
  ),
}));
const collaborator = {
  id: "B",
  handle: "artistB",
  display: "Custom credit name",
  pfp: "https://example.com/avatar.png",
};
function mount(size: "default" | "compact" = "compact") {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemeCollaboratorCredits
        collaborators={[
          collaborator,
          { ...collaborator, id: "C", handle: "artistC" },
        ]}
        size={size}
      />
    </QueryClientProvider>
  );
}
beforeEach(() => jest.clearAllMocks());
it.each(["default", "compact"] as const)(
  "renders every collaborator's normal profile identity and badges at %s size",
  async (size) => {
    jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => ({
      id: endpoint.endsWith("b") ? "B" : "C",
      handle: endpoint.endsWith("b") ? "artistB" : "artistC",
      pfp: collaborator.pfp,
      level: 21,
      classification: ApiProfileClassification.Pseudonym,
    }));
    mount(size);
    const list = screen.getByRole("list", { name: "Collaborators" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    for (const handle of ["artistB", "artistC"]) {
      expect(within(list).getByRole("link", { name: handle })).toHaveAttribute(
        "href",
        `/${handle}`
      );
    }
    await waitFor(() =>
      expect(screen.getAllByText("Level 21")).toHaveLength(2)
    );
    expect(screen.getByText(`Badges B ${size}`)).toBeVisible();
    expect(screen.getByText(`Badges C ${size}`)).toBeVisible();
    expect(list.querySelectorAll("img")).toHaveLength(2);
    expect(screen.queryByText("Custom credit name")).not.toBeInTheDocument();
  }
);
it("keeps all profile links and avatars when enrichment fails, without inventing badges", async () => {
  jest.mocked(commonApiFetch).mockRejectedValue(new Error("unavailable"));
  mount();
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("link", { name: "artistB" })).toHaveAttribute(
    "href",
    "/artistB"
  );
  expect(screen.getByRole("link", { name: "artistC" })).toHaveAttribute(
    "href",
    "/artistC"
  );
  expect(screen.queryByText(/Badges/)).not.toBeInTheDocument();
});

it("retains accepted handles when a resolved profile has an empty handle", async () => {
  jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => ({
    id: endpoint.endsWith("b") ? "B" : "C",
    handle: "",
    pfp: null,
    level: 21,
    classification: ApiProfileClassification.Pseudonym,
  }));
  mount();
  await waitFor(() => expect(screen.getAllByText("Level 21")).toHaveLength(2));
  expect(screen.getByRole("link", { name: "artistB" })).toHaveAttribute(
    "href",
    "/artistB"
  );
  expect(screen.getByRole("link", { name: "artistC" })).toHaveAttribute(
    "href",
    "/artistC"
  );
});
