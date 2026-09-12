"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import {
  ApiMarketBatchOperationStateEnum,
  type ApiMarketBatchOperation,
} from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { t } from "@/i18n/messages";
import {
  fetchMarketBatchCapabilities,
  prepareMarketBatch,
  continueMarketBatch,
} from "@/services/api/market-batch-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import CollectBatchReviewForm from "./CollectBatchReviewForm";
import CollectBatchQuoteReview from "./CollectBatchQuoteReview";
import CollectTransactionRecovery from "./CollectTransactionRecovery";
import {
  CollectTradeDialog,
  type CollectTradePresentation,
} from "./CollectTradeSheet";
import { buildCollectBatchRequest } from "./collect-batch-request";
import type { CollectBatchDraft } from "./collect-batch.types";
import type { CollectSelectedListing } from "./collect-selection.helpers";
import { collectProfileWallets } from "./collect-recipient.helpers";
import { marketConnectionReason } from "./collect-trade.helpers";
import {
  batchNeedsPolling,
  fetchRecoverableMarketBatch,
} from "./market-batch-recovery";
import { batchSendAttempt } from "./market-batch-send";
import { readMarketBatch, saveMarketBatch } from "./market-batch-storage";
import { validateMarketBatchOperation } from "./market-batch-validation";
import { useMarketBatchExecution } from "./useMarketBatchExecution";
import { useMarketSettlement } from "./useMarketSettlement";
import {
  findResumableMarketBatch,
  marketBatchProfileLock,
} from "./market-batch-resume";
import { withMarketOperationLock } from "./market-operation-lock";
import { marketPreparationError } from "./market-preparation-errors";

interface Props {
  readonly items: readonly CollectSelectedListing[];
  readonly initialRecipient?: string;
  readonly initialOperation?: ApiMarketBatchOperation;
  readonly onClose: () => void;
  readonly onSettled?: (operation: ApiMarketBatchOperation) => void;
  readonly onMarketChange?: () => void;
  readonly presentation?: CollectTradePresentation;
}

export default function CollectBatchController(props: Props) {
  const auth = useAuth();
  const connection = useSeizeConnectContext();
  const scope = [
    auth.connectedProfile?.id ?? "public",
    ...collectProfileWallets(auth.connectedProfile)
      .map((item) => item.wallet.toLowerCase())
      .sort((left, right) => left.localeCompare(right)),
    connection.address?.toLowerCase() ?? "",
    String(auth.isAuthenticated),
    String(Boolean(auth.activeProfileProxy)),
    props.initialOperation?.id ?? "",
    props.initialRecipient ?? "",
    JSON.stringify(
      props.items.map((item) => [
        item.asset.asset_key,
        item.order.identity.protocol_address,
        item.order.identity.order_hash,
        item.quantity,
        item.order.total_wei,
      ])
    ),
  ].join(":");
  return <ScopedBatchController key={scope} {...props} />;
}

function ScopedBatchController({
  items,
  initialRecipient,
  initialOperation,
  onClose,
  onSettled,
  onMarketChange,
  presentation = "dialog",
}: Props) {
  const locale = useBrowserLocale(),
    auth = useAuth(),
    connection = useSeizeConnectContext();
  const { isCapacitor } = useCapacitor(),
    client = useQueryClient();
  const [operation, setOperation] = useState(initialOperation ?? null);
  const [preparedRequest, setExpected] =
    useState<ApiMarketBatchPrepareRequest | null>(() =>
      initialOperation
        ? (readMarketBatch(initialOperation.profile_id, initialOperation.id)
            ?.request ?? null)
        : null
    );
  const [editedOperationId, setEditedOperationId] = useState<string>();
  const [preparing, setPreparing] = useState(false),
    [error, setError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(false),
    pending = useRef(false);
  const scopeIsActive = () => mounted.current;
  const formContainer = useRef<HTMLDivElement>(null);
  const priorPrepare = useRef<{
    request: ApiMarketBatchPrepareRequest;
    key: string;
    fingerprint: string;
  } | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const capability = useQuery({
    queryKey: [QueryKey.COLLECT_CAPABILITIES, "BUY_BATCH"],
    queryFn: ({ signal }) => fetchMarketBatchCapabilities(signal),
    staleTime: 15_000,
  });
  const resumeItems = items.map((item) => ({
    asset_key: item.asset.asset_key,
    order: item.order.identity,
  }));
  const resume = useQuery({
    queryKey: [
      QueryKey.MARKET_OPERATION,
      "BUY_BATCH_RESUME",
      auth.connectedProfile?.id,
      JSON.stringify(resumeItems),
      editedOperationId,
    ],
    queryFn: ({ signal }) =>
      findResumableMarketBatch(auth.connectedProfile!.id!, resumeItems, {
        signal,
        ...(editedOperationId ? { excludeId: editedOperationId } : {}),
      }),
    enabled:
      !initialOperation &&
      operation === null &&
      items.length > 0 &&
      auth.isAuthenticated === true &&
      !auth.activeProfileProxy &&
      Boolean(auth.connectedProfile?.id),
    retry: false,
  });
  const activeOperation = operation ?? resume.data?.operation ?? null;
  const activeOperationId = activeOperation?.id;
  const expected = preparedRequest ?? resume.data?.request ?? null;
  useEffect(() => {
    if (!activeOperationId) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeOperationId]);
  const polling = useQuery({
    queryKey: [
      QueryKey.MARKET_OPERATION,
      "BUY_BATCH",
      auth.connectedProfile?.id,
      activeOperation?.id,
    ],
    queryFn: ({ signal }) =>
      fetchRecoverableMarketBatch(
        activeOperation!.id,
        activeOperation!.profile_id,
        signal
      ),
    enabled: Boolean(
      activeOperation &&
      auth.connectedProfile?.id === activeOperation.profile_id &&
      auth.isAuthenticated &&
      !auth.activeProfileProxy
    ),
    refetchInterval: (query) => {
      const value = query.state.data ?? activeOperation;
      return value && batchNeedsPolling(value) ? 5000 : false;
    },
  });
  const displayed = polling.data ?? activeOperation;
  const receive = (value: ApiMarketBatchOperation) => {
    if (!mounted.current) return;
    const queryKey = [
      QueryKey.MARKET_OPERATION,
      "BUY_BATCH",
      value.profile_id,
      value.id,
    ];
    void client.cancelQueries({ queryKey });
    client.setQueryData(queryKey, value);
    setOperation(value);
    void client.invalidateQueries({
      queryKey: [QueryKey.MARKET_MY_OPERATIONS],
    });
  };
  useMarketSettlement(
    displayed,
    () => {
      if (displayed) onSettled?.(displayed);
    },
    onMarketChange
  );
  const execution = useMarketBatchExecution(receive);
  const reason = marketConnectionReason({
    capabilityEnabled: capability.data?.available === true,
    isProxy: Boolean(auth.activeProfileProxy),
    isSafe: connection.isSafeWallet,
    isNative: isCapacitor,
    isAuthenticated: auth.isAuthenticated === true,
    canSign: connection.canSignActiveWallet,
    address: connection.address,
    profile: auth.connectedProfile,
    operation: displayed,
    hasExpected:
      expected !== null ||
      displayed?.state !== ApiMarketBatchOperationStateEnum.Review,
    cancelTarget: undefined,
  });
  const checkingResume =
    !initialOperation &&
    operation === null &&
    items.length > 0 &&
    resume.isFetching;
  let disabledReason: string | undefined;
  if (reason) disabledReason = t(locale, reason);
  else if (resume.isError)
    disabledReason = t(locale, "collect.trade.checkFailed");
  else if (checkingResume)
    disabledReason = t(locale, "collect.trade.stage.reconciling");
  const prepare = async (draft: CollectBatchDraft) => {
    if (
      pending.current ||
      disabledReason ||
      !auth.connectedProfile?.id ||
      !connection.address
    )
      return;
    pending.current = true;
    setPreparing(true);
    setError(undefined);
    try {
      const request = buildCollectBatchRequest(
        draft,
        auth.connectedProfile,
        connection.address
      );
      await withMarketOperationLock(
        marketBatchProfileLock(request.profile_id),
        async () => {
          const unresolved = await findResumableMarketBatch(
            request.profile_id,
            request.items,
            { includeReview: false }
          );
          if (!scopeIsActive()) return;
          if (unresolved) {
            setExpected(unresolved.request);
            receive(unresolved.operation);
            return;
          }
          const fingerprint = JSON.stringify(request);
          if (priorPrepare.current?.fingerprint !== fingerprint)
            priorPrepare.current = {
              request,
              fingerprint,
              key: crypto.randomUUID(),
            };
          const attempt = priorPrepare.current;
          const result = await prepareMarketBatch(attempt.request, attempt.key);
          validateMarketBatchOperation(
            result,
            request,
            collectProfileWallets(auth.connectedProfile).map(
              (item) => item.wallet
            )
          );
          if (!saveMarketBatch(request.profile_id, result.id, { request }))
            throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
          if (!scopeIsActive()) return;
          setExpected(request);
          receive(result);
          priorPrepare.current = null;
        }
      );
    } catch (failure) {
      if (mounted.current) setError(marketPreparationError(failure, locale));
    } finally {
      pending.current = false;
      if (mounted.current) setPreparing(false);
    }
  };
  const refresh = async () => {
    if (
      !displayed ||
      !expected ||
      pending.current ||
      execution.busy ||
      batchSendAttempt(displayed)
    )
      return;
    pending.current = true;
    setPreparing(true);
    setError(undefined);
    try {
      const value = await continueMarketBatch(displayed.id);
      validateMarketBatchOperation(
        value,
        expected,
        collectProfileWallets(auth.connectedProfile).map((item) => item.wallet)
      );
      if (value.id !== displayed.id) throw new Error("MARKET_REVIEW_MISMATCH");
      receive(value);
    } catch (failure) {
      if (mounted.current) setError(marketPreparationError(failure, locale));
    } finally {
      pending.current = false;
      if (mounted.current) setPreparing(false);
    }
  };
  const unresolved = displayed
    ? batchSendAttempt(displayed) !== undefined
    : false;
  const expired =
    displayed?.state === ApiMarketBatchOperationStateEnum.Review &&
    displayed.expires_at <= now;
  let operationDisabledReason: string | undefined;
  if (unresolved)
    operationDisabledReason = t(locale, "collect.trade.broadcastUnknown");
  else if (expired)
    operationDisabledReason = t(locale, "collect.trade.expired");
  const reviewDisabledReason = disabledReason ?? operationDisabledReason;
  const content = (
    <div className="tw-space-y-5 tw-p-5 sm:tw-p-6">
      {(reason === "collect.trade.connectSigner" ||
        reason === "collect.trade.reconnect") && (
        <Button variant="secondary" onClick={() => connection.seizeConnect()}>
          {t(locale, "collect.connect")}
        </Button>
      )}
      {!initialOperation && (
        <div ref={formContainer} hidden={displayed !== null}>
          <CollectBatchReviewForm
            items={items}
            profile={auth.connectedProfile}
            {...(connection.address
              ? { payingWallet: connection.address }
              : {})}
            {...(initialRecipient ? { initialRecipient } : {})}
            loading={preparing}
            error={error}
            disabledReason={disabledReason}
            maxItems={capability.data?.max_orders ?? 128}
            maxAllocations={capability.data?.max_allocations ?? 256}
            onPrepare={(draft) => {
              void prepare(draft);
            }}
            onClose={onClose}
          />
        </div>
      )}
      {!displayed && resume.isError && (
        <Button
          variant="secondary"
          onClick={() => {
            void resume.refetch();
          }}
        >
          {t(locale, "collect.retry")}
        </Button>
      )}
      {displayed && (
        <CollectBatchQuoteReview
          canEdit={!initialOperation}
          operation={displayed}
          items={items}
          busy={preparing || execution.busy}
          disabledReason={reviewDisabledReason}
          message={error ?? execution.message}
          onConfirm={async () => {
            if (expected && !disabledReason && !unresolved && !expired)
              await execution.confirm(displayed, expected);
          }}
          onEdit={() => {
            if (
              !unresolved &&
              displayed.state === ApiMarketBatchOperationStateEnum.Review
            ) {
              setOperation(null);
              setEditedOperationId(displayed.id);
              setExpected(null);
              setError(undefined);
              queueMicrotask(() =>
                formContainer.current
                  ?.querySelector<HTMLElement>("input, button")
                  ?.focus()
              );
            }
          }}
          onClose={onClose}
        />
      )}
      {displayed &&
        expired &&
        displayed.state === ApiMarketBatchOperationStateEnum.Review &&
        !unresolved && (
          <Button
            variant="secondary"
            disabled={preparing || execution.busy || !expected}
            onClick={() => {
              void refresh();
            }}
          >
            {t(locale, "collect.retry")}
          </Button>
        )}
      {displayed && unresolved && (
        <CollectTransactionRecovery
          disabled={execution.busy}
          onRecover={(hash) => execution.recoverTransaction(displayed, hash)}
        />
      )}
    </div>
  );
  return presentation === "contents" ? (
    content
  ) : (
    <CollectTradeDialog
      open
      title={t(locale, "collect.selection.review")}
      onClose={onClose}
    >
      {content}
    </CollectTradeDialog>
  );
}
