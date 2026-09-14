"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import ManifoldMintingDetails, {
  type MintReceipt,
} from "./ManifoldMintingDetails";
import ManifoldMintingTransactionLink from "./ManifoldMintingTransactionLink";

export type { MintReceipt } from "./ManifoldMintingDetails";

export default function ManifoldMintingSuccess({
  receipt,
  transactionUrl,
  onClose,
}: Readonly<{
  receipt: MintReceipt;
  transactionUrl: string;
  onClose: () => void;
}>) {
  const locale = useBrowserLocale();
  return (
    <>
      <ManifoldMintingDetails receipt={receipt} />
      <Button fullWidth size="lg" onClick={onClose}>
        {t(locale, "theMemes.mint.transaction.done")}
      </Button>
      <ManifoldMintingTransactionLink href={transactionUrl} />
    </>
  );
}
