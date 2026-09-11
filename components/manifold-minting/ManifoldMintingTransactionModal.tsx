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
  const isSuccess = status === "success";
  return (
    <OnchainTransactionModal
      status={status}
      title={
        isSuccess
          ? t(locale, "theMemes.mint.transaction.success")
          : getTransactionModalTitle(locale, contract, tokenId)
      }
      subtitle={
        isSuccess
          ? t(locale, "theMemes.mint.transaction.successDescription")
          : undefined
      }
      closeLabel={
        isSuccess ? t(locale, "theMemes.mint.transaction.close") : undefined
      }
      successContent={
        isSuccess && receipt && transactionHash ? (
          <ManifoldMintingSuccess
            receipt={receipt}
            transactionUrl={getTransactionLink(chain.id, transactionHash)}
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
