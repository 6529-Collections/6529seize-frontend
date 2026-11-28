"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Address, Hex, TransactionReceipt } from "viem";
import { useSignTypedData, useWriteContract } from "wagmi";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

import { sepoliaTxUrl } from "./format";
import { TxStatus } from "./TxStatus";
import { errorNameOf, sendStreamTx, StreamTxError, type TxRequest, type TxState } from "./sendStreamTx";
import { useStreamWallet } from "./WalletGate";

export interface StepIo {
  readonly account: Address;
  /** Simulates, sends, waits for the block. Throws when it fails. */
  send(request: TxRequest): Promise<TransactionReceipt>;
  /** Asks the wallet for an EIP-712 signature. */
  signTypedData(data: unknown): Promise<Hex>;
}

export interface Step<Context> {
  readonly id: string;
  /** What this step does, in a few words. */
  readonly label: string;
  /** One line: what it costs or why it is needed. */
  readonly help?: string | undefined;
  /** Runs the step. Returns false when the chain already has it (nothing sent). */
  run(context: Context, io: StepIo): Promise<boolean | void>;
}

type StepStatus = "waiting" | "running" | "done" | "skipped" | "failed";

const STATUS_TONE: Record<StepStatus, string> = {
  done: "tw-bg-emerald-400/15 tw-text-emerald-400",
  skipped: "tw-bg-emerald-400/15 tw-text-emerald-400",
  failed: "tw-bg-red/15 tw-text-red",
  running: "tw-bg-primary-500/20 tw-text-primary-300",
  waiting: "tw-bg-white/[0.06] tw-text-iron-400",
};

/**
 * Runs a list of transactions in order with visible progress. Each step checks
 * the chain first, so "Continue" after a failure resumes where it stopped.
 */
export function StepRunner<Context>({
  steps,
  context,
  startLabel,
  onFinished,
  disabled = false,
}: {
  readonly steps: readonly Step<Context>[];
  readonly context: Context;
  readonly startLabel: string;
  readonly onFinished?: ((context: Context) => void) | undefined;
  readonly disabled?: boolean | undefined;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [hashes, setHashes] = useState<Record<string, Hex[]>>({});
  const [current, setCurrent] = useState<{ id: string; tx: TxState } | null>(null);
  const [running, setRunning] = useState(false);
  const finished = steps.every((step) => {
    const status = statuses[step.id];
    return status === "done" || status === "skipped";
  });

  const runAll = async (account: Address) => {
    setRunning(true);
    try {
      for (const step of steps) {
        const status = statuses[step.id];
        if (status === "done" || status === "skipped") continue;
        setStatuses((all) => ({ ...all, [step.id]: "running" }));
        setCurrent({ id: step.id, tx: { phase: "idle" } });
        const io: StepIo = {
          account,
          send: (request) =>
            sendStreamTx({
              account,
              request,
              writeContractAsync: writeContractAsync as never,
              onState: (tx) => {
                if (tx.hash) {
                  const hash = tx.hash;
                  setHashes((all) =>
                    (all[step.id] ?? []).includes(hash) ? all : { ...all, [step.id]: [...(all[step.id] ?? []), hash] }
                  );
                }
                setCurrent({ id: step.id, tx });
              },
            }),
          signTypedData: async (data) => {
            setCurrent({ id: step.id, tx: { phase: "wallet" } });
            return signTypedDataAsync(data as never);
          },
        };
        try {
          const sent = await step.run(context, io);
          setStatuses((all) => ({ ...all, [step.id]: sent === false ? "skipped" : "done" }));
        } catch (error) {
          setStatuses((all) => ({ ...all, [step.id]: "failed" }));
          setCurrent((previous) => ({
            id: step.id,
            tx: {
              phase: "error",
              hash: error instanceof StreamTxError ? error.hash : previous?.tx.hash,
              error: errorNameOf(error),
            },
          }));
          return;
        }
      }
      setCurrent(null);
      await queryClient.invalidateQueries({ queryKey: [QueryKey.STREAM_SEPOLIA] });
      onFinished?.(context);
    } finally {
      setRunning(false);
    }
  };

  const anyStarted = Object.keys(statuses).length > 0;
  return (
    <StepRunnerView
      steps={steps}
      statuses={statuses}
      hashes={hashes}
      current={current}
      running={running}
      disabled={disabled}
      finished={finished}
      label={anyStarted ? t(locale, "streamSepolia.steps.continue") : startLabel}
      onRun={runAll}
    />
  );
}

function StepRunnerView<Context>({
  steps,
  statuses,
  hashes,
  current,
  running,
  disabled,
  finished,
  label,
  onRun,
}: {
  readonly steps: readonly Step<Context>[];
  readonly statuses: Record<string, StepStatus>;
  readonly hashes: Record<string, Hex[]>;
  readonly current: { id: string; tx: TxState } | null;
  readonly running: boolean;
  readonly disabled: boolean;
  readonly finished: boolean;
  readonly label: string;
  readonly onRun: (account: Address) => void;
}) {
  const locale = useBrowserLocale();
  const account = useStreamWallet().address;
  return (
    <div>
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0">
        {steps.map((step, index) => {
          const status = statuses[step.id] ?? "waiting";
          return (
            <li
              key={step.id}
              className="tw-grid tw-grid-cols-[1.75rem_minmax(0,1fr)] tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-py-3"
            >
              <span
                aria-hidden="true"
                className={`tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-text-xs tw-font-semibold ${STATUS_TONE[status]}`}
              >
                {status === "done" || status === "skipped" ? "✓" : index + 1}
              </span>
              <div className="tw-min-w-0">
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {step.label}
                  <span className="tw-sr-only">
                    {" "}
                    {t(locale, `streamSepolia.steps.status.${status}`)}
                  </span>
                </p>
                {step.help ? <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-500">{step.help}</p> : null}
                {status === "skipped" ? (
                  <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-500">{t(locale, "streamSepolia.steps.already")}</p>
                ) : null}
                {(hashes[step.id] ?? []).length > 0 && current?.id !== step.id ? (
                  <p className="tw-m-0 tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-3 tw-text-xs">
                    {(hashes[step.id] ?? []).map((hash) => (
                      <a key={hash} href={sepoliaTxUrl(hash)} target="_blank" rel="noreferrer" className="tw-text-primary-300 tw-underline tw-underline-offset-4">
                        {t(locale, "streamSepolia.tx.view")}
                      </a>
                    ))}
                  </p>
                ) : null}
                {current?.id === step.id ? <TxStatus state={current.tx} /> : null}
              </div>
            </li>
          );
        })}
      </ol>
      {finished ? null : (
        <div className="tw-mt-4">
          <Button
            variant="action"
            size="lg"
            loading={running}
            disabled={running || disabled || !account}
            onClick={() => account && onRun(account)}
          >
            {label}
          </Button>
        </div>
      )}
    </div>
  );
}
