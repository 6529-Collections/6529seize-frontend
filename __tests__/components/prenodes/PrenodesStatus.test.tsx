import { render, screen, waitFor } from "@testing-library/react";
import PrenodesStatus from "@/components/prenodes/PrenodesStatus";
import { TitleProvider } from "@/contexts/TitleContext";
import { useAuth } from "@/components/auth/Auth";

jest.mock("@/components/auth/Auth");

const mockUseContext = useAuth as jest.Mock;

describe("PrenodesStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it("links to address when user is connected", async () => {
    const prenode = {
      ip: "1.2.3.4",
      domain: "node.example",
      city: "NY",
      country: "US",
      tdh_sync: true,
      ping_status: "green" as const,
      block_sync: true,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2020-01-02T00:00:00Z",
    };
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: [prenode], count: 1 }),
    });
    mockUseContext.mockReturnValue({
      connectedProfile: { primary_wallet: "0xabc" },
    });

    render(
      <TitleProvider>
        <PrenodesStatus />
      </TitleProvider>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://node.example/oracle/address/0xabc"
    );
  });

  it("shows Unknown location and default link when not connected", async () => {
    const prenode = {
      ip: "1.2.3.4",
      domain: "node.example",
      city: "",
      country: "",
      tdh_sync: false,
      ping_status: "orange" as const,
      block_sync: false,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2020-01-02T00:00:00Z",
    };
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ data: [prenode], count: 1 }),
    });
    mockUseContext.mockReturnValue({ address: undefined });

    render(
      <TitleProvider>
        <PrenodesStatus />
      </TitleProvider>
    );

    await screen.findByText("Unknown");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://node.example/oracle/tdh/total"
    );
  });
});
