import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { deserialize, serialize } from "node:v8";
import type { ReactNode } from "react";

import { StreamProvider } from "@/components/stream/data/StreamProvider";
import { FederatedContractPage } from "@/components/stream/federated/FederatedContractPage";
import { FederatedDirectoryPage } from "@/components/stream/federated/FederatedDirectoryPage";
import { LaunchWizard } from "@/components/stream/federated/LaunchWizard";
import { createMockStream } from "@/lib/stream/mock";

// jsdom has no structuredClone; the mock engine snapshots its state with it.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = ((value: unknown) =>
    deserialize(serialize(value))) as typeof structuredClone;
}

function renderWithStream(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StreamProvider>{ui}</StreamProvider>
    </QueryClientProvider>
  );
}

const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("the launch wizard", () => {
  it("walks an artist from the form to a first auction, with inline errors", async () => {
    const user = userEvent.setup();
    renderWithStream(<LaunchWizard />);

    // 1. The form.
    await screen.findByRole("heading", { name: "Choose the form" });
    await user.click(continueButton());
    expect(screen.getByText("Choose a form.")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Linked pair/ }));
    await user.click(continueButton());

    // 2. Identity: the connected wallet.
    await screen.findByRole("heading", { name: "Your identity" });
    expect(screen.getByText("Wallet")).toBeInTheDocument();
    await user.click(continueButton());

    // 3. Name, symbol and license, validated inline.
    await screen.findByRole("heading", { name: "Name, symbol and license" });
    await user.click(continueButton());
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await user.type(screen.getByLabelText("Name"), "Harbor Studio");
    await user.type(screen.getByLabelText("Symbol"), "harbor");
    expect(screen.getByLabelText("Symbol")).toHaveValue("HARBOR");
    await user.click(continueButton());

    // 4. Review and deploy, with labelled gas.
    await screen.findByRole("heading", { name: "Review and deploy" });
    expect(
      await screen.findByRole("table", {
        name: "Deploy gas · Sepolia, estimated",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("About 63.9M gas · Sepolia, estimated")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Harbor Studio Editions · HARBORE")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deploy" }));

    // 5. Registered as active.
    await screen.findByRole("heading", { name: "Registered as active" });
    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open the contract page" })
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/stream\/federated\/0x/)
    );
    await user.click(continueButton());

    // 6. The first sale, from the contract's sale methods.
    await screen.findByRole("heading", { name: "Your first sale" });
    const start = await screen.findByRole("button", {
      name: "Start the 1/1 auction",
    });
    await user.click(start);
    expect(screen.getByText("Give the work a title.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Title of the work"), "Harbor Light");
    await user.click(start);
    expect(
      await screen.findByText("Started: Harbor Light.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the work" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/stream\/works\/0x[0-9a-f]{40}-1$/)
    );
  });
});

describe("the federated directory", () => {
  it("lists active contracts, folds pairs and shows delistings on demand", async () => {
    const user = userEvent.setup();
    renderWithStream(<FederatedDirectoryPage />);
    const table = await screen.findByRole("table", {
      name: "Federated contracts in the registry",
    });
    expect(
      within(table).getByRole("link", { name: "Halden Studio" })
    ).toBeInTheDocument();
    expect(
      within(table).getAllByRole("link", { name: "Ohm Rooms" })
    ).toHaveLength(1);
    expect(within(table).queryByText("Mara Vell Official")).toBeNull();

    await user.selectOptions(screen.getByLabelText("Status"), "DELISTED");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "Mara Vell Official" })
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/· impersonation/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Status"), "ALL");
    await user.selectOptions(screen.getByLabelText("Type"), "ERC1155");
    await waitFor(() =>
      expect(screen.getByText("Contracts: 1")).toBeInTheDocument()
    );
    expect(
      screen.getByRole("link", { name: "Reik Multiples" })
    ).toBeInTheDocument();
  });

  it("compares the three tiers", async () => {
    renderWithStream(<FederatedDirectoryPage />);
    expect(
      await screen.findByRole("row", {
        name: /Unbid 1\/1 .*Back to the artist/,
      })
    ).toBeInTheDocument();
  });
});

describe("a delisted contract's page", () => {
  it("explains what still works and offers no sale", async () => {
    const seed = createMockStream({ wallNow: () => 0 });
    const [delisted] = await seed.dataSource.federatedDirectory({
      status: "DELISTED",
    });
    renderWithStream(
      <FederatedContractPage address={delisted?.address ?? "0x"} />
    );
    expect(
      await screen.findByRole("heading", { name: "Delisted by TDH vote" })
    ).toBeInTheDocument();
    expect(screen.getByText("Still works")).toBeInTheDocument();
    expect(
      screen.getByText("No sales through the network's auctions.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sale methods" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Start a sale" })).toBeNull();
  });
});
