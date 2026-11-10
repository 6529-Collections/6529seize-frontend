import { Filesystem } from "@capacitor/filesystem";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppWalletSavedRecoveryFilesNotice from "@/components/app-wallets/AppWalletSavedRecoveryFilesNotice";
import { removeStaleSharedFiles } from "@/helpers/capacitorBlobDownload.helpers";

jest.mock("@capacitor/filesystem", () => ({
  Directory: { Documents: "DOCUMENTS", Cache: "CACHE" },
  Filesystem: { readdir: jest.fn(), deleteFile: jest.fn() },
}));
jest.mock("@/helpers/capacitorBlobDownload.helpers", () => ({
  removeStaleSharedFiles: jest.fn(),
}));

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const OTHER_ADDRESS = "0xdef0000000000000000000000000000000000002";

const file = (name: string, type: "file" | "directory" = "file") => ({
  name,
  type,
  size: 10,
  mtime: 0,
  uri: `file:///documents/${name}`,
});

const PLAINTEXT = `My_Wallet-${ADDRESS}-plaintext-recovery.txt`;
const ENCRYPTED = `Renamed-${ADDRESS.toLowerCase()}-encrypted-recovery.json`;

const renderNotice = () =>
  render(<AppWalletSavedRecoveryFilesNotice address={ADDRESS} />);

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Filesystem.deleteFile).mockResolvedValue();
  jest.mocked(removeStaleSharedFiles).mockResolvedValue();
});

describe("AppWalletSavedRecoveryFilesNotice", () => {
  it("shows nothing when no saved recovery file belongs to this wallet", async () => {
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [
        file(`Other-${OTHER_ADDRESS}-plaintext-recovery.txt`),
        file("notes.txt"),
        file(PLAINTEXT, "directory"),
      ],
    });
    const { container } = renderNotice();

    await waitFor(() => expect(Filesystem.readdir).toHaveBeenCalled());
    expect(Filesystem.readdir).toHaveBeenCalledWith({
      directory: "DOCUMENTS",
      path: "",
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the folder cannot be listed", async () => {
    jest.mocked(Filesystem.readdir).mockRejectedValue(new Error("Unsupported"));
    const { container } = renderNotice();

    await waitFor(() => expect(Filesystem.readdir).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("explains a plaintext file and removes exactly the matching files", async () => {
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [
        file(PLAINTEXT),
        file(ENCRYPTED),
        file(`Other-${OTHER_ADDRESS}-plaintext-recovery.txt`),
      ],
    });
    renderNotice();

    const region = await screen.findByRole("region", {
      name: "Recovery file saved on this device",
    });
    expect(region).toHaveTextContent(
      "It contains the recovery phrase and private key in readable form."
    );
    expect(region).toHaveTextContent(
      "make sure you have saved the recovery phrase somewhere safe"
    );

    const fileList = screen.getByRole("list", {
      name: "Files that will be removed:",
    });
    const listed = within(fileList)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(listed).toEqual([PLAINTEXT, ENCRYPTED]);
    expect(removeStaleSharedFiles).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove saved recovery files" })
    );

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(
      "The saved recovery files were removed from this device."
    );
    expect(status).toHaveFocus();
    expect(Filesystem.deleteFile).toHaveBeenCalledTimes(2);
    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      directory: "DOCUMENTS",
      path: PLAINTEXT,
    });
    expect(Filesystem.deleteFile).toHaveBeenCalledWith({
      directory: "DOCUMENTS",
      path: ENCRYPTED,
    });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("describes an encrypted-only file without the plaintext warning", async () => {
    jest
      .mocked(Filesystem.readdir)
      .mockResolvedValue({ files: [file(ENCRYPTED)] });
    renderNotice();

    const region = await screen.findByRole("region");
    expect(region).toHaveTextContent("an encrypted recovery file");
    expect(region).not.toHaveTextContent("readable form");
  });

  it("keeps the notice and reports files that could not be removed", async () => {
    jest.mocked(Filesystem.readdir).mockResolvedValue({
      files: [file(PLAINTEXT), file(ENCRYPTED)],
    });
    jest
      .mocked(Filesystem.deleteFile)
      .mockImplementation(({ path }) =>
        path === PLAINTEXT
          ? Promise.reject(new Error("denied"))
          : Promise.resolve()
      );
    renderNotice();

    await userEvent.click(
      await screen.findByRole("button", { name: "Remove saved recovery files" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Some recovery files could not be removed."
    );
    const button = screen.getByRole("button", {
      name: "Remove saved recovery files",
    });
    await waitFor(() => expect(button).toHaveFocus());
    expect(screen.getByRole("region")).toHaveTextContent("readable form");
  });
});
