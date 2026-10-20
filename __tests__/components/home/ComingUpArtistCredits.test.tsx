import {
  ComingUpArtistCredits,
  type ComingUpCreditSource,
} from "@/components/home/next-mint-leading/ComingUpArtistCredits";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const author = {
  id: "artist",
  handle: "phoebeum",
  pfp: "https://example.com/artist.png",
  primary_address: "0x529",
} as ApiDrop["author"];
const collaborators = Array.from({ length: 5 }, (_, index) => ({
  id: `collaborator-${index}`,
  handle: `usrname-${index}`,
  display: `Credit ${index}`,
  pfp: "https://example.com/collaborator.png",
}));
const dropHref = "/waves/main-stage?drop=artwork";

function mount(credits: ComingUpCreditSource["collaborators"] = []) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ComingUpArtistCredits
        author={author}
        collaborators={credits}
        dropHref={dropHref}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockRejectedValue(new Error("unavailable"));
});

it("keeps the single artist credit when there are no collaborators", () => {
  mount();
  expect(screen.getByRole("link", { name: "phoebeum" })).toHaveAttribute(
    "href",
    "/phoebeum"
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(commonApiFetch).not.toHaveBeenCalled();
});

it("keeps accepted credits linked when profile enrichment is unavailable", async () => {
  const { container } = mount(collaborators.slice(0, 1));
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("link", { name: "usrname-0" })).toHaveAttribute(
    "href",
    "/usrname-0"
  );
  expect(container).toHaveTextContent("with usrname-0");
  expect(container.querySelectorAll("img")).toHaveLength(2);
  expect(screen.queryByText("Collaborators:")).not.toBeInTheDocument();
});

it("caps the stack at four avatars and links to the remaining credits", () => {
  const { container } = mount(collaborators);
  expect(container.querySelectorAll("img")).toHaveLength(4);
  expect(screen.getByText("+2")).toBeInTheDocument();
  expect(
    screen.getByRole("link", {
      name: "+3 more View all collaborators on this drop",
    })
  ).toHaveAttribute("href", dropHref);
  expect(screen.getByRole("link", { name: "usrname-1" })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "usrname-2" })
  ).not.toBeInTheDocument();
});

it("uses a renamed collaborator's current identity without level or trophy badges", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({
    id: collaborators[0]!.id,
    handle: "new-handle",
    pfp: "https://example.com/new.png",
    classification: "PSEUDONYM",
    level: 100,
    badges: {},
  });
  mount(collaborators.slice(0, 1));
  expect(
    await screen.findByRole("link", { name: "new-handle" })
  ).toHaveAttribute("href", "/new-handle");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByText("100")).not.toBeInTheDocument();
});
