import type { Chain } from "viem";
import OnchainTransactionModal, {
  type OnchainTransactionModalStatus,
} from "@/components/common/OnchainTransactionModal";
import { getTransactionLink } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import ManifoldMintingSuccess, {
  type MintReceipt,
} from "./ManifoldMintingSuccess";
import { getTransactionModalTitle } from "./ManifoldMintingWidget.utils";
import ManifoldMintingProgress from "./ManifoldMintingProgress";

const TITLES = {
  confirm_wallet: "theMemes.mint.transaction.walletTitle",
  submitted: "theMemes.mint.transaction.submittedTitle",
  success: "theMemes.mint.transaction.success",
} as const;

const DESCRIPTIONS = {
  confirm_wallet: "theMemes.mint.transaction.walletDescription",
  submitted: "theMemes.mint.transaction.submittedDescription",
  success: "theMemes.mint.transaction.successDescription",
} as const;

export default function ManifoldMintingTransactionModal({
  status,
  contract,
  tokenId,
  chain,
  transactionHash,
  message,
  receipt,
  onClose,
}: Readonly<{
  status: OnchainTransactionModalStatus;
  contract: string;
  tokenId: number | undefined;
  chain: Pick<Chain, "id">;
  transactionHash: string | undefined;
  message: string | undefined;
  receipt: MintReceipt | undefined;
  onClose: () => void;
}>) {
  const locale = useBrowserLocale();
  const isError = status === "error";
  const isPending = status === "confirm_wallet" || status === "submitted";
  const transactionUrl = transactionHash
    ? getTransactionLink(chain.id, transactionHash)
    : undefined;
  return (
    <OnchainTransactionModal
      status={status}
      title={
        isError
          ? getTransactionModalTitle(locale, contract, tokenId)
          : t(locale, TITLES[status])
      }
      subtitle={isError ? undefined : t(locale, DESCRIPTIONS[status])}
      closeLabel={
        isError ? undefined : t(locale, "theMemes.mint.transaction.close")
      }
      pendingContent={
        isPending ? (
          <ManifoldMintingProgress
            status={status}
            receipt={receipt}
            transactionUrl={transactionUrl}
          />
        ) : undefined
      }
      successContent={
        status === "success" && receipt && transactionUrl ? (
          <ManifoldMintingSuccess
            receipt={receipt}
            transactionUrl={transactionUrl}
            onClose={onClose}
          />
        ) : undefined
      }
      message={message}
      transactionHash={transactionHash}
      chain={chain}
      onClose={onClose}
    />
  );
}
