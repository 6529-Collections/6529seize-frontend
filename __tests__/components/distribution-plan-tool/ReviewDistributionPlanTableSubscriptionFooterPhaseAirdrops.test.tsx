import {
  DistributionPhaseAirdropsModal,
  type DistributionAirdropsPhase,
} from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const walletRow = `0x${"a".repeat(40)},2`;

function renderModal(phase: DistributionAirdropsPhase) {
  const onUpload = jest.fn(async () => true);
  render(
    <DistributionPhaseAirdropsModal
      plan={{ id: "plan", name: "Meme 576", description: "", createdAt: 0 }}
      phase={phase}
      isUploading={false}
      handleClose={jest.fn()}
      confirmedTokenId="576"
      onUpload={onUpload}
    />
  );
  const submit = screen.getByRole("button", {
    name: /Upload (Artist|Team) Airdrops/,
  });
  return { onUpload, submit };
}

async function chooseCsv(contents: string) {
  const file = new File([contents], "airdrops.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: async () => contents });
  await userEvent.upload(screen.getByLabelText("Or upload a CSV file"), file);
}

it.each(["artist", "team"] as const)(
  "re-uploads the downloaded %s CSV without its header in the API payload",
  async (phase) => {
    const { onUpload, submit } = renderModal(phase);
    await chooseCsv(`\uFEFFaddress,count\r\n${walletRow}\r\n`);

    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);

    expect(onUpload).toHaveBeenCalledWith(
      MEMES_CONTRACT,
      "576",
      phase,
      walletRow
    );
  }
);

it("also uploads a headerless file", async () => {
  const { onUpload, submit } = renderModal("team");
  await chooseCsv(walletRow);

  await waitFor(() => expect(submit).toBeEnabled());
  await userEvent.click(submit);

  expect(onUpload).toHaveBeenCalledWith(
    MEMES_CONTRACT,
    "576",
    "team",
    walletRow
  );
});

it("rejects file headers other than address,count", async () => {
  const { onUpload, submit } = renderModal("artist");
  await chooseCsv(`wallet,count\n${walletRow}`);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    'Invalid Ethereum address "wallet"'
  );
  expect(submit).toBeDisabled();
  expect(onUpload).not.toHaveBeenCalled();
});

it("still requires headerless rows when pasting", async () => {
  const { onUpload, submit } = renderModal("artist");
  const paste = screen.getByLabelText("Paste CSV");
  fireEvent.change(paste, { target: { value: `address,count\n${walletRow}` } });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Do not include a header"
  );
  expect(submit).toBeDisabled();

  fireEvent.change(paste, { target: { value: walletRow } });
  await userEvent.click(submit);

  expect(onUpload).toHaveBeenCalledWith(
    MEMES_CONTRACT,
    "576",
    "artist",
    walletRow
  );
});
