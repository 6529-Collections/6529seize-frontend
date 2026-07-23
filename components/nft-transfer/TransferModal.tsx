"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransfer } from "./TransferState";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { ContractType } from "@/types/enums";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createPortal } from "react-dom";
import {
  isAddress,
  type Address,
  type PublicClient,
  type WalletClient,
  type WriteContractParameters,
} from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  anyTxsPending,
  BodyByFlow,
  FlowTitle,
  FooterActions,
  HeaderRight,
} from "./TransferModal.view";
import type { FlowState, TxEntry } from "./TransferModal.types";

const ERC721_ABI = [
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const ERC1155_ABI = [
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "id", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "safeBatchTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "ids", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

const MANIFOLD_CORE_ABI = [
  {
    type: "function",
    name: "tokenExtension",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

type TxItem = {
  key: string;
  tokenId: bigint;
  qty: bigint;
  contractType: ContractType;
  contract: Address;
};

type WalletClientWithWrite = {
  writeContract: (req: WriteContractParameters) => Promise<`0x${string}`>;
};

const waitForPaint = async () => {
  if (!globalThis.window) return;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

function hasWriteContract(
  client: WalletClient | undefined
): client is WalletClient & WalletClientWithWrite {
  return !!client && typeof client.writeContract === "function";
}

export default function TransferModal({
  open,
  onClose,
}: {
  readonly open: boolean;
  readonly onClose: (opts?: { completed?: boolean | undefined }) => void;
}) {
  const t = useTransfer();
  const [selectedProfile, setSelectedProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const leftListRef = useRef<HTMLUListElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  const [leftHasOverflow, setLeftHasOverflow] = useState(false);
  const [leftAtEnd, setLeftAtEnd] = useState(false);

  const [isClosing, setIsClosing] = useState(false);

  const [flow, setFlow] = useState<FlowState>("review");
  const [txs, setTxs] = useState<TxEntry[]>([]);

  const trxPending = useMemo(() => anyTxsPending(txs), [txs]);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const groupByContractAndOriginator = useCallback(
    async (publicClient: PublicClient, items: TxItem[]) => {
      const by = new Map<
        string,
        {
          contract: string;
          collection: string;
          originKey: string;
          is1155: boolean;
          items: TxItem[];
        }
      >();

      const getOriginKey = async (contract: Address, tokenId: bigint) => {
        try {
          const ext = (await publicClient.readContract({
            address: contract,
            abi: MANIFOLD_CORE_ABI,
            functionName: "tokenExtension",
            args: [tokenId],
          })) as Address;
          return `ext:${ext.toLowerCase()}`;
        } catch {
          // core-minted (no extension for token)
          return `core:${contract.toLowerCase()}`;
        }
      };

      for (const it of items) {
        const contract = (it.contract as string).toLowerCase();
        const is1155 = it.contractType === ContractType.ERC1155;

        let originKey = "erc721";
        if (is1155) {
          const id = BigInt(it.tokenId);
          originKey = await getOriginKey(contract as Address, id);
        }

        const key = `${contract}::${originKey}`;
        const existing = by.get(key);
        if (existing) {
          existing.items.push(it);
        } else {
          by.set(key, {
            contract,
            collection: it.key.split(":")[0]!,
            originKey,
            is1155,
            items: [it],
          });
        }
      }

      return by;
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setSelectedProfile(null);
      setSelectedWallet(null);
      setFlow("review");
      setLeftHasOverflow(false);
      setLeftAtEnd(false);
      setIsClosing(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const items = useMemo(
    () =>
      Array.from(t.selected.values()).map((it) => ({
        key: it.key,
        qty: Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1)),
        title: it.title,
        thumbUrl: it.thumbUrl,
      })),
    [t.selected]
  );

  useEffect(() => {
    const hasOverflow = (el: HTMLElement | null) =>
      !!el && el.scrollHeight > el.clientHeight;

    const check = () => {
      setLeftHasOverflow(hasOverflow(leftListRef.current));

      const nearBottom = (el: HTMLElement | null) => {
        if (!el) return false;
        const threshold = 4;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
      };

      setLeftAtEnd(nearBottom(leftListRef.current));
    };

    check();
    globalThis.addEventListener("resize", check);

    const leftEl = leftListRef.current;

    const onScrollLeft = () => {
      const el = leftListRef.current;
      if (!el) return;
      const threshold = 4;
      setLeftAtEnd(
        el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      );
    };

    leftEl?.addEventListener("scroll", onScrollLeft);

    return () => {
      globalThis.removeEventListener("resize", check);
      leftEl?.removeEventListener("scroll", onScrollLeft);
    };
  }, [open, items]);

  const totalUnits = t.totalQty;
  const canConfirm = open && selectedWallet && totalUnits > 0;

  const handleClose = useCallback(() => {
    if (trxPending) return;
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose({
        completed:
          flow !== "review" &&
          txs.length > 0 &&
          !txs.every((t) => t.state === "error"),
      });
    }, 150);
  }, [isClosing, onClose, flow, trxPending, txs]);

  const handleConfirm = useCallback(async () => {
    if (!publicClient || !address) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Client not ready",
          state: "error",
          error: "Client not ready. Please reconnect.",
        },
      ]);
      setFlow("submission");
      return;
    }

    const selItems: TxItem[] = Array.from(t.selected.values()).map((it) => ({
      contract: it.contract as Address,
      tokenId: BigInt(it.tokenId),
      qty: BigInt(Math.min(Math.max(1, it.qty ?? 1), Math.max(1, it.max ?? 1))),
      key: it.key,
      contractType: it.contractType,
    }));

    const byContract = await groupByContractAndOriginator(
      publicClient,
      selItems
    );
    for (const value of Array.from(byContract.values())) {
      value.items.sort((a, b) =>
        a.tokenId.toString().localeCompare(b.tokenId.toString())
      );
    }

    const initial: TxEntry[] = [];
    for (const [
      key,
      { collection, originKey, contract, is1155, items: citems },
    ] of Array.from(byContract.entries())) {
      if (is1155) {
        const itemsLabel = citems
          .map((x: TxItem) => {
            const tokenId = x.tokenId.toString();
            const count = x.qty;
            return `#${tokenId}(x${count})`;
          })
          .join(" - ");
        initial.push({
          id: `${key}-batch`,
          originKey,
          label: `${collection} ${itemsLabel}`,
          state: "pending",
        });
      } else {
        for (const x of citems) {
          initial.push({
            id: `${contract}-${x.tokenId.toString()}`,
            originKey,
            label: `${collection} #${x.tokenId.toString()}`,
            state: "pending",
          });
        }
      }
    }
    setTxs(initial);
    setFlow("submission");

    if (!walletClient) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Wallet not ready",
          state: "error",
          error: "Wallet not ready. Please reconnect.",
        },
      ]);
      return;
    }

    if (!selectedWallet || !isAddress(selectedWallet)) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Invalid destination wallet",
          state: "error",
          error: "Invalid destination wallet. Please choose another wallet.",
        },
      ]);
      return;
    }

    if (!hasWriteContract(walletClient)) {
      setTxs([
        {
          id: "init",
          originKey: "init",
          label: "Wallet not ready",
          state: "error",
          error: "Wallet does not support writeContract.",
        },
      ]);
      return;
    }

    const destinationWallet = selectedWallet as Address;
    const write = walletClient.writeContract;

    for (const [key, { contract, is1155, items: citems }] of Array.from(
      byContract.entries()
    )) {
      if (is1155) {
        // Try batch
        try {
          const ids = citems.map((x: TxItem) => x.tokenId);
          const amts = citems.map((x: TxItem) => x.qty);
          const { request } = await publicClient.simulateContract({
            account: address,
            address: contract as Address,
            abi: ERC1155_ABI,
            functionName: "safeBatchTransferFrom",
            args: [address as Address, destinationWallet, ids, amts, "0x"],
          });

          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch` ? { ...e, state: "awaiting_approval" } : e
            )
          );

          const hash = await write(request);
          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch` ? { ...e, state: "submitted", hash } : e
            )
          );
          await waitForPaint();
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });
          setTxs((prev) =>
            prev.map((e) =>
              e.id === `${key}-batch`
                ? {
                    ...e,
                    state: receipt.status === "success" ? "success" : "error",
                  }
                : e
            )
          );
          await waitForPaint();
        } catch (e) {
          console.error("Error in batch 1155 transfer", e);
          const record = e as {
            details?: unknown;
            shortMessage?: unknown;
            message?: unknown;
          } | null;
          setTxs((prev) =>
            prev.map((te) =>
              te.id === `${key}-batch`
                ? {
                    ...te,
                    state: "error",
                    error: String(
                      record?.details ??
                        (record?.shortMessage || record?.message || e)
                    ),
                  }
                : te
            )
          );
        }
      } else {
        // ERC721 one by one
        for (const x of citems) {
          const tid = `${contract}-${x.tokenId.toString()}`;
          try {
            const { request } = await publicClient.simulateContract({
              account: address,
              address: contract as Address,
              abi: ERC721_ABI,
              functionName: "safeTransferFrom",
              args: [address as Address, destinationWallet, x.tokenId],
            });

            setTxs((prev) =>
              prev.map((te) =>
                te.id === tid ? { ...te, state: "awaiting_approval" } : te
              )
            );

            try {
              const hash = await write(request);
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid ? { ...te, state: "submitted", hash } : te
                )
              );
              await waitForPaint();
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
              });
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid
                    ? {
                        ...te,
                        state:
                          receipt.status === "success" ? "success" : "error",
                      }
                    : te
                )
              );
              await waitForPaint();
            } catch (e) {
              console.error("Error in 721 transfer", e);
              const record = e as {
                shortMessage?: unknown;
                message?: unknown;
              } | null;
              setTxs((prev) =>
                prev.map((te) =>
                  te.id === tid
                    ? {
                        ...te,
                        state: "error",
                        error: String(
                          record?.shortMessage || record?.message || e
                        ),
                      }
                    : te
                )
              );
            }
          } catch (error) {
            const record = error as {
              shortMessage?: unknown;
              message?: unknown;
            } | null;
            setTxs((prev) =>
              prev.map((te) =>
                te.id === tid
                  ? {
                      ...te,
                      state: "error",
                      error: String(
                        record?.shortMessage || record?.message || error
                      ),
                    }
                  : te
              )
            );
          }
        }
      }
    }
  }, [
    publicClient,
    address,
    t.selected,
    selectedWallet,
    walletClient,
    groupByContractAndOriginator,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Escape" || e.key === "Esc") && !trxPending) {
        e.preventDefault();
        handleClose();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [open, trxPending, handleClose]);

  if (!open) return null;

  const portalTarget = typeof document === "undefined" ? null : document.body;
  const modalContent = (
    <dialog
      ref={dialogRef}
      open
      aria-modal="true"
      aria-labelledby="transfer-title"
      aria-describedby="transfer-desc"
      onCancel={(e) => {
        e.preventDefault();
        if (!trxPending) handleClose();
      }}
      className={[
        "tw-fixed tw-inset-0 tw-z-[1000] tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-white/10 tw-p-0 tw-backdrop-blur-sm",
        isClosing
          ? "tw-opacity-0 tw-transition-opacity tw-duration-150"
          : "tw-opacity-100 tw-transition-opacity tw-duration-150",
      ].join(" ")}
    >
      <div
        className={[
          "tw-flex tw-h-[85dvh] tw-max-h-[720px] tw-w-[95vw] tw-max-w-[1000px] tw-flex-col tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-white tw-shadow-2xl tw-ring-1 tw-ring-white/10 sm:tw-w-[90vw] md:tw-h-[min(720px,80dvh)] md:tw-w-[78vw]",
          isClosing
            ? "tw-scale-95 tw-opacity-0 tw-transition-all tw-duration-150"
            : "tw-scale-100 tw-opacity-100 tw-transition-all tw-duration-150",
          flow === "submission" || isClosing
            ? "tw-h-fit sm:tw-max-h-[90dvh] md:tw-max-h-[90vh]"
            : "",
        ].join(" ")}
      >
        {/* header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-p-4 sm:tw-px-6 sm:tw-py-5">
          <div className="tw-min-w-0 tw-flex-1 tw-pr-2 tw-text-base tw-font-semibold sm:tw-text-lg">
            <FlowTitle flow={flow} txs={txs} />
          </div>
          <HeaderRight
            flow={flow}
            trxPending={trxPending}
            onClose={handleClose}
          />
        </div>
        <p id="transfer-desc" className="tw-sr-only">
          {flow === "review"
            ? "Review selected NFTs and choose the destination recipient and wallet."
            : "Follow wallet prompts. Each transaction will indicate its current status."}
        </p>

        {/* body */}
        <BodyByFlow
          flow={flow}
          open={open}
          items={items}
          leftListRef={leftListRef}
          leftHasOverflow={leftHasOverflow}
          leftAtEnd={leftAtEnd}
          selectedProfile={selectedProfile}
          setSelectedProfile={setSelectedProfile}
          setSelectedWallet={setSelectedWallet}
          selectedWallet={selectedWallet}
          publicClient={publicClient}
          txs={txs}
        />

        {/* footer */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-p-4 sm:tw-gap-3 sm:tw-px-6 sm:tw-py-5">
          <div className="tw-flex tw-items-center tw-gap-2">
            {flow === "submission" && anyTxsPending(txs) && (
              <>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="tw-size-8 tw-text-amber-300"
                />
                <span className="tw-text-sm tw-font-medium tw-text-amber-300">
                  Double-check the recipient address and token details before
                  signing.
                  <br />
                  NFT transfers are irreversible once submitted on-chain.
                </span>
              </>
            )}
          </div>
          <FooterActions
            flow={flow}
            canConfirm={!!canConfirm}
            onCancel={handleClose}
            onConfirm={handleConfirm}
            onClose={handleClose}
            txs={txs}
          />
        </div>
      </div>
    </dialog>
  );

  if (!isMounted || !portalTarget) return null;
  return createPortal(modalContent, portalTarget);
}
