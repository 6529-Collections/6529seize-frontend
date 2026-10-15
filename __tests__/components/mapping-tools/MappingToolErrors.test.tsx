import ConsolidationMappingTool from "@/components/mapping-tools/ConsolidationMappingTool";
import DelegationMappingTool from "@/components/mapping-tools/DelegationMappingTool";
import { downloadCsvFile } from "@/components/mapping-tools/mappingToolDownload";
import { DELEGATION_ALL_ADDRESS } from "@/constants/constants";
import { fetchAllPages } from "@/services/6529api";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

jest.mock("@/services/6529api", () => ({ fetchAllPages: jest.fn() }));
jest.mock("@/components/mapping-tools/mappingToolDownload", () => ({
  downloadCsvFile: jest.fn(),
}));

let mockCsvRows: Record<string, string>[] = [];
let mockParserError: Error | undefined;
jest.mock("csv-parser", () => () => {
  const handlers: Record<string, (value?: unknown) => void> = {};
  const parser = {
    on: (event: string, callback: (value?: unknown) => void) => {
      handlers[event] = callback;
      return parser;
    },
    write: jest.fn(),
    end: () => {
      if (mockParserError) {
        handlers["error"]?.(mockParserError);
        return;
      }
      for (const row of mockCsvRows) {
        handlers["data"]?.(row);
      }
      handlers["end"]?.();
    },
  };
  return parser;
});

const fetchAllPagesMock = fetchAllPages as jest.Mock;
const downloadCsvFileMock = downloadCsvFile as jest.Mock;

async function uploadAndSubmit({ pickDelegationOptions = false } = {}) {
  const input = document.querySelector(
    'input[type="file"]'
  ) as HTMLInputElement;
  await userEvent.upload(
    input,
    new File(["a"], "test.csv", { type: "text/csv" })
  );
  if (pickDelegationOptions) {
    const useCase = screen.getByLabelText(
      "Select Use Case"
    ) as HTMLSelectElement;
    const option = Array.from(useCase.options).find(
      ({ disabled }) => !disabled
    );
    await userEvent.selectOptions(useCase, option!.value);
  }
  await userEvent.click(screen.getByRole("button", { name: /submit/i }));
}

const TOOLS: ReadonlyArray<{
  name: string;
  element: ReactElement;
  uploadOptions: { pickDelegationOptions: boolean };
}> = [
  {
    name: "DelegationMappingTool",
    element: <DelegationMappingTool />,
    uploadOptions: { pickDelegationOptions: true },
  },
  {
    name: "ConsolidationMappingTool",
    element: <ConsolidationMappingTool />,
    uploadOptions: { pickDelegationOptions: false },
  },
];

describe.each(TOOLS)("$name error handling", ({ element, uploadOptions }) => {
  beforeEach(() => {
    fetchAllPagesMock.mockReset();
    downloadCsvFileMock.mockReset();
    mockCsvRows = [];
    mockParserError = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows an alert and stops processing when the data cannot be loaded", async () => {
    fetchAllPagesMock.mockRejectedValue(new Error("network down"));
    render(element);

    await uploadAndSubmit(uploadOptions);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The data needed to map your file could not be loaded. Please try again."
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
    expect(downloadCsvFileMock).not.toHaveBeenCalled();
  });

  it("shows an alert and stops processing when the file cannot be read", async () => {
    fetchAllPagesMock.mockResolvedValue([]);
    jest
      .spyOn(File.prototype, "text")
      .mockRejectedValue(new Error("unreadable"));
    render(element);

    await uploadAndSubmit(uploadOptions);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your CSV file could not be read. Check the file and try again."
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  it("shows an alert and stops processing when the CSV cannot be parsed", async () => {
    fetchAllPagesMock.mockResolvedValue([]);
    mockParserError = new Error("bad csv");
    render(element);

    await uploadAndSubmit(uploadOptions);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your CSV file could not be read. Check the file and try again."
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  it("clears the alert when the user submits again", async () => {
    fetchAllPagesMock.mockRejectedValueOnce(new Error("network down"));
    fetchAllPagesMock.mockReturnValueOnce(new Promise(() => undefined));
    render(element);

    await uploadAndSubmit(uploadOptions);
    await screen.findByRole("alert");

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /processing/i })
    ).toBeInTheDocument();
  });
});

describe("mapping tool downloads", () => {
  beforeEach(() => {
    fetchAllPagesMock.mockReset();
    downloadCsvFileMock.mockReset();
    mockParserError = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("downloads the delegation mapping as lower-case output.csv", async () => {
    mockCsvRows = [{ _0: "0xABC" }];
    fetchAllPagesMock.mockResolvedValue([
      {
        from_address: "0xabc",
        to_address: "0xDEF",
        collection: DELEGATION_ALL_ADDRESS,
        use_case: 1,
      },
    ]);
    render(<DelegationMappingTool />);

    await uploadAndSubmit({ pickDelegationOptions: true });

    await waitFor(() =>
      expect(downloadCsvFileMock).toHaveBeenCalledWith("0xdef", "output.csv")
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  it("downloads the consolidation mapping as consolidation_output.csv", async () => {
    mockCsvRows = [
      {
        _0: "address",
        _1: "token_id",
        _2: "balance",
        _3: "contract",
        _4: "name",
      },
      { _0: "0xaaa", _1: "1", _2: "2", _3: "0xcontract", _4: "Meme" },
    ];
    fetchAllPagesMock.mockResolvedValue([
      { wallets: ["0xaaa"], primary: "0xaaa" },
    ]);
    render(<ConsolidationMappingTool />);

    await uploadAndSubmit();

    await waitFor(() =>
      expect(downloadCsvFileMock).toHaveBeenCalledWith(
        "address,token_id,balance,contract,name\n0xaaa,1,2,0xcontract,Meme",
        "consolidation_output.csv"
      )
    );
    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });
});
