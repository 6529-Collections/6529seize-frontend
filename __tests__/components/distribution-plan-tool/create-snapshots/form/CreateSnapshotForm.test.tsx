import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/distribution-plan-api");
jest.mock("@/helpers/AllowlistToolHelpers", () => {
  const actual = jest.requireActual("@/helpers/AllowlistToolHelpers");
  return {
    __esModule: true,
    ...actual,
    isEthereumAddress: jest.fn(),
    getRandomObjectId: jest.fn(() => "random-id"),
  };
});

import CreateSnapshotForm from "@/components/distribution-plan-tool/create-snapshots/form/CreateSnapshotForm";
import { DistributionPlanToolContext } from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";
import { INTERN_JPGS_COLLECTION_ID } from "@/components/distribution-plan-tool/create-snapshots/form/snapshot-collections";
import { AllowlistOperationCode } from "@/components/allowlist-tool/allowlist-tool.types";

const { isEthereumAddress } = require("@/helpers/AllowlistToolHelpers");

jest.mock(
  "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn",
  () =>
    ({ children, loading }: any) => (
      <button type="submit" disabled={loading}>
        {children}
      </button>
    )
);

const fetchMock = distributionPlanApiFetch as jest.Mock;
const postMock = distributionPlanApiPost as jest.Mock;
const isEthMock = isEthereumAddress as jest.Mock;

function renderForm(
  ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>
) {
  const defaultCtx = {
    distributionPlan: { id: "dp1" },
    fetchOperations: jest.fn(),
  } as any;
  return {
    fetchOperations: ctx?.fetchOperations || defaultCtx.fetchOperations,
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <CreateSnapshotForm />
      </DistributionPlanToolContext.Provider>
    ),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  fetchMock.mockResolvedValue({ success: false, data: null });
  isEthMock.mockImplementation((val: string) =>
    /^0x[a-fA-F0-9]{40}$/.test(val)
  );
});

describe("CreateSnapshotForm", () => {
  it("loads latest block number on mount", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: 100 });
    renderForm();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/other/latest-block-number")
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Block number")).toHaveValue(100)
    );
    expect(screen.getByPlaceholderText("Consolidate block number")).toHaveValue(
      "100"
    );
  });

  it("auto fills name from contract metadata", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: 100 });
    fetchMock.mockResolvedValueOnce({
      success: true,
      data: { name: "CoolToken" },
    });
    isEthMock.mockImplementation((val: string) =>
      /^0x[a-fA-F0-9]{40}$/.test(val)
    );
    renderForm();
    const contractInput = screen.getByPlaceholderText("Contract address");
    await userEvent.type(
      contractInput,
      "0x1234567890123456789012345678901234567890"
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/other/contract-metadata/0x1234567890123456789012345678901234567890"
      )
    );
    expect(
      (screen.getByPlaceholderText("Snapshot name") as HTMLInputElement).value
    ).toBe("CoolToken");
  });

  it("submits snapshot and resets form", async () => {
    fetchMock.mockResolvedValueOnce({ success: true, data: 50 });
    postMock.mockResolvedValueOnce({ success: true });
    const fetchOperations = jest.fn();
    renderForm({ fetchOperations });
    await userEvent.type(screen.getByPlaceholderText("Snapshot name"), "Snap");
    await userEvent.type(
      screen.getByPlaceholderText("Contract address"),
      "0x1111111111111111111111111111111111111111"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Empty for All tokens"),
      "1,2"
    );
    await userEvent.clear(
      screen.getByPlaceholderText("Consolidate block number")
    );
    await userEvent.type(
      screen.getByPlaceholderText("Consolidate block number"),
      "60"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /add snapshot/i })
    );
    await waitFor(() => expect(postMock).toHaveBeenCalled());
    const call = postMock.mock.calls[0][0];
    expect(call).toEqual({
      endpoint: "/allowlists/dp1/operations",
      body: expect.objectContaining({
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params: expect.objectContaining({
          name: "Snap",
          description: "Snap",
          contract: "0x1111111111111111111111111111111111111111",
          blockNo: 50,
          tokenIds: "1,2",
          consolidateBlockNo: 60,
        }),
      }),
    });
    await waitFor(() => expect(fetchOperations).toHaveBeenCalledWith("dp1"));
    expect(screen.getByPlaceholderText("Snapshot name")).toHaveValue("");
    expect(screen.getByPlaceholderText("Contract address")).toHaveValue("");
    expect(screen.getByPlaceholderText("Empty for All tokens")).toHaveValue("");
  });
});

const shortcuts = [
  [
    "The Memes by 6529",
    "ERC1155",
    "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  ],
  ["Meme Lab", "ERC1155", "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb"],
  ["6529 Gradient", "ERC721", "0x0c58ef43ff3032005e472cb5709f8908acb00205"],
  ["6529 RAW", "ERC721", "0x07e24ee32163da59297b5341bef8f8a2eead271e"],
  ["6529 Intern JPGs", "ERC1155", "0x495f947276749ce646f68ac8c248420045cb7b5e"],
] as const;

const deferredMetadata = () => {
  let resolve!: (value: { success: boolean; data: { name: string } }) => void;
  const promise = new Promise<{ success: boolean; data: { name: string } }>(
    (done) => {
      resolve = done;
    }
  );
  return { promise, resolve };
};

describe("fixed snapshot collection shortcuts", () => {
  it("shows all five named, illustrated shortcuts without depending on metadata or keyword search", async () => {
    renderForm();
    const section = screen.getByRole("region", {
      name: "Use a 6529 collection",
    });
    expect(within(section).getAllByRole("button")).toHaveLength(5);
    for (const [name, standard] of shortcuts) {
      const row = within(section).getByRole("button", {
        name: `${name} ${standard}`,
        pressed: false,
      });
      expect(row.querySelector("img")).toHaveAttribute(
        "src",
        expect.stringMatching(/^https:/)
      );
    }
    expect(
      screen.queryByPlaceholderText("Search NFT collection")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/all time volume|floor/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Or enter another collection" })
    ).toBeVisible();
    await userEvent.type(screen.getByLabelText("Name"), "arbitrary keywords");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/other/latest-block-number");
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each(shortcuts.slice(1, 4))(
    "selects %s with its canonical address and clears old token IDs",
    async (name, standard, address) => {
      fetchMock.mockResolvedValueOnce({ success: true, data: 100 });
      renderForm();
      await userEvent.type(screen.getByLabelText("Token ID(s)"), "3,7-9");
      await userEvent.click(
        screen.getByRole("button", { name: `${name} ${standard}` })
      );
      expect(screen.getByLabelText("Name")).toHaveValue(name);
      expect(screen.getByLabelText("Contract address")).toHaveValue(address);
      expect(screen.getByLabelText("Token ID(s)")).toHaveValue("");
      expect(screen.getByLabelText("Block number")).toHaveValue(100);
      expect(screen.getByLabelText(/Consolidation block number/)).toHaveValue(
        "100"
      );
      expect(
        screen.getByRole("button", {
          name: `${name} ${standard}`,
          pressed: true,
        })
      ).toBeVisible();
      await userEvent.type(screen.getByLabelText("Name"), " custom");
      expect(
        screen.getByRole("button", {
          name: `${name} ${standard}`,
          pressed: false,
        })
      ).toBeVisible();
    }
  );

  it("supports Tab, Enter and Space on the shortcut rows", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "The Memes by 6529 ERC1155" })
    ).toHaveFocus();
    await user.tab();
    const lab = screen.getByRole("button", { name: "Meme Lab ERC1155" });
    expect(lab).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(lab).toHaveAttribute("aria-pressed", "true");
    await user.tab();
    await user.keyboard(" ");
    expect(
      screen.getByRole("button", {
        name: "6529 Gradient ERC721",
        pressed: true,
      })
    ).toHaveFocus();
    expect(lab).toHaveAttribute("aria-pressed", "false");
  });

  it("opens the Memes season picker and applies selected seasons", async () => {
    fetchMock.mockImplementation(async (endpoint: string) => ({
      success: true,
      data:
        endpoint === "/other/memes-seasons"
          ? [
              { season: 1, tokenIds: "1-47" },
              { season: 2, tokenIds: "48-86" },
            ]
          : 100,
    }));
    renderForm();
    await userEvent.click(
      screen.getByRole("button", { name: "The Memes by 6529 ERC1155" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: 'Select "The Memes by 6529" Seasons',
    });
    await userEvent.click(
      await within(dialog).findByRole("checkbox", { name: "SZN1 (1-47)" })
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Select" })
    );
    expect(screen.getByLabelText("Name")).toHaveValue("The Memes by 6529 SZN1");
    expect(screen.getByLabelText("Contract address")).toHaveValue(
      shortcuts[0][2]
    );
    expect(screen.getByLabelText("Token ID(s)")).toHaveValue("1-47");
    expect(
      screen.getByRole("button", {
        name: "The Memes by 6529 ERC1155",
        pressed: true,
      })
    ).toBeVisible();
  });

  it("preserves Intern JPG token IDs without numeric conversion", async () => {
    const tokenIds = `${(BigInt(2) ** BigInt(256) - BigInt(1)).toString()},2-4`;
    fetchMock.mockImplementation(async (endpoint: string) => ({
      success: true,
      data: endpoint.includes("contract-token-ids-as-string")
        ? { tokenIds }
        : 100,
    }));
    renderForm();
    await userEvent.click(
      screen.getByRole("button", { name: "6529 Intern JPGs ERC1155" })
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Name")).toHaveValue("6529 Intern JPGs")
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/other/contract-token-ids-as-string/${INTERN_JPGS_COLLECTION_ID}`
    );
    expect(screen.getByLabelText("Contract address")).toHaveValue(
      shortcuts[4][2]
    );
    expect(screen.getByLabelText("Token ID(s)")).toHaveValue(tokenIds);
  });

  it.each(["failure", "empty", "reject"])(
    "keeps the current form and supports retry after an Intern lookup %s",
    async (failure) => {
      fetchMock.mockImplementation(async (endpoint: string) => {
        if (!endpoint.includes("contract-token-ids-as-string"))
          return { success: true, data: 100 };
        if (failure === "reject") throw new Error("Unavailable");
        return { success: failure === "empty", data: { tokenIds: "" } };
      });
      renderForm();
      await userEvent.click(
        screen.getByRole("button", { name: "Meme Lab ERC1155" })
      );
      const intern = screen.getByRole("button", {
        name: "6529 Intern JPGs ERC1155",
      });
      await userEvent.click(intern);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Your collection details have not changed"
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Meme Lab");
      expect(screen.getByLabelText("Contract address")).toHaveValue(
        shortcuts[1][2]
      );
      expect(intern).toHaveAttribute("aria-busy", "false");
      expect(intern).toHaveAttribute("aria-pressed", "false");
      expect(
        screen.getByRole("button", { name: "Add snapshot" })
      ).toBeEnabled();
      fetchMock.mockResolvedValue({ success: true, data: { tokenIds: "5-9" } });
      await userEvent.click(intern);
      expect(screen.getByLabelText("Name")).toHaveValue("6529 Intern JPGs");
      expect(screen.getByLabelText("Token ID(s)")).toHaveValue("5-9");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
  );

  it("does not let a pending Intern selection overwrite a newer shortcut", async () => {
    let resolve!: (value: {
      success: boolean;
      data: { tokenIds: string };
    }) => void;
    fetchMock.mockImplementation((endpoint: string) =>
      endpoint.includes("contract-token-ids-as-string")
        ? new Promise((done) => {
            resolve = done;
          })
        : Promise.resolve({ success: true, data: 100 })
    );
    renderForm();
    await userEvent.click(
      screen.getByRole("button", { name: "6529 Intern JPGs ERC1155" })
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading collection token IDs"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Meme Lab ERC1155" })
    );
    await act(async () => {
      resolve({ success: true, data: { tokenIds: "999" } });
    });
    expect(screen.getByLabelText("Name")).toHaveValue("Meme Lab");
    expect(screen.getByLabelText("Token ID(s)")).toHaveValue("");
  });
});

describe("manual exact-address metadata", () => {
  const address = "0x1234567890123456789012345678901234567890";

  it.each([
    { success: false, data: null },
    { success: true, data: null },
  ])("allows manual entry after unavailable metadata: %j", async (response) => {
    fetchMock.mockResolvedValue(response);
    renderForm();
    fireEvent.change(screen.getByLabelText("Contract address"), {
      target: { value: address },
    });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/other/contract-metadata/${address}`
      )
    );
    expect(screen.getByLabelText("Name")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Name"), "My collection");
    expect(screen.getByLabelText("Name")).toHaveValue("My collection");
    expect(postMock).not.toHaveBeenCalled();
  });

  it.each(["name", "contract", "shortcut"])(
    "ignores late metadata after changing %s",
    async (change) => {
      const deferred = deferredMetadata();
      fetchMock.mockImplementation((endpoint: string) =>
        endpoint.includes("contract-metadata/")
          ? deferred.promise
          : Promise.resolve({ success: true, data: 100 })
      );
      renderForm();
      fireEvent.change(screen.getByLabelText("Contract address"), {
        target: { value: address },
      });
      if (change === "name")
        await userEvent.type(screen.getByLabelText("Name"), "My name");
      if (change === "contract")
        await userEvent.clear(screen.getByLabelText("Contract address"));
      if (change === "shortcut")
        await userEvent.click(
          screen.getByRole("button", { name: "6529 RAW ERC721" })
        );
      await act(async () => {
        deferred.resolve({ success: true, data: { name: "Stale name" } });
      });
      expect(screen.getByLabelText("Name")).not.toHaveValue("Stale name");
    }
  );

  it("does not request metadata for partial addresses or an existing name", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Contract address"), "0x123");
    await userEvent.type(screen.getByLabelText("Name"), "Manual name");
    fireEvent.change(screen.getByLabelText("Contract address"), {
      target: { value: address },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(postMock).not.toHaveBeenCalled();
  });
});

it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"])(
  "keeps snapshot controls usable with the %s locale fallback",
  async (locale) => {
    const languageSpy = jest
      .spyOn(navigator, "languages", "get")
      .mockReturnValue([locale]);
    try {
      renderForm();
      expect(
        screen.getByRole("region", { name: "Use a 6529 collection" })
      ).toBeVisible();
      expect(screen.getByLabelText("Contract address")).toBeVisible();
      await userEvent.click(
        screen.getByRole("button", { name: "Meme Lab ERC1155" })
      );
      expect(screen.getByLabelText("Name")).toHaveValue("Meme Lab");
    } finally {
      languageSpy.mockRestore();
    }
  }
);
