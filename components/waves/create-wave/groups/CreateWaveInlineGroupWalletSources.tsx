"use client";

import { ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import type { DragEvent } from "react";
import { useId, useRef, useState } from "react";
import type {
  AllowlistDescription,
  AllowlistResult,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import EmmaListSearch from "@/components/utils/input/emma/EmmaListSearch";
import { formatInteger } from "@/i18n/format";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { parseGroupWalletCsv } from "@/helpers/groups/group-wallet-csv";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import {
  dedupeInlineWallets,
  type CreateWaveInlineGroupWalletSources,
} from "./createWaveInlineGroupBuilder";

type WalletSourcesUpdate = Partial<CreateWaveInlineGroupWalletSources>;

interface InlineWalletSourcesProps {
  readonly direction: "included" | "excluded";
  readonly sources: CreateWaveInlineGroupWalletSources;
  readonly onChange: (update: WalletSourcesUpdate) => void;
}

function RemoveSourceButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-950 tw-p-0 tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-error desktop-hover:hover:tw-ring-error/40"
    >
      <TrashIcon aria-hidden="true" className="tw-size-4" />
    </button>
  );
}

function SourceCount({
  count,
  sourceName,
}: {
  readonly count: number;
  readonly sourceName?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const key =
    count === 1
      ? "waves.create.groups.inlineIdentities.sources.count.one"
      : "waves.create.groups.inlineIdentities.sources.count.other";

  return (
    <p
      aria-live="polite"
      className="tw-m-0 tw-min-w-0 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-300"
    >
      {t(locale, key, { count: formatInteger(locale, count) })}
      {sourceName ? (
        <span className="tw-block tw-truncate tw-text-iron-500">
          {sourceName}
        </span>
      ) : null}
    </p>
  );
}

function EmmaWalletSource({
  sources,
  onChange,
}: Omit<InlineWalletSourcesProps, "direction">) {
  const locale = useBrowserLocale();
  const { connectedProfile, requestAuth } = useAuth();
  const queryClient = useQueryClient();
  const selectedId = sources.selectedAllowlist?.id ?? null;
  const requestIdRef = useRef(0);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle"
  );

  const loadAllowlist = async (allowlist: AllowlistDescription) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadState("loading");
    try {
      const wallets = await queryClient.fetchQuery<readonly string[]>({
        queryKey: [
          QueryKey.EMMA_ALLOWLIST_RESULT,
          { allowlistId: allowlist.id },
        ],
        queryFn: async () => {
          const auth = await requestAuth();
          if (!auth.success) {
            throw new Error("EMMA authentication failed");
          }
          const response = await distributionPlanApiFetch<AllowlistResult[]>(
            `/allowlists/${allowlist.id}/results`
          );
          if (!response.success || response.data === null) {
            throw new Error("EMMA allowlist could not be loaded");
          }
          return dedupeInlineWallets(response.data.map((item) => item.wallet));
        },
        staleTime: 5 * 60 * 1000,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      onChange({ selectedAllowlist: allowlist, emmaWallets: wallets });
      setLoadState("idle");
    } catch {
      if (requestId === requestIdRef.current) {
        setLoadState("error");
      }
    }
  };

  const onSelect = (allowlist: AllowlistDescription) => {
    onChange({ selectedAllowlist: allowlist, emmaWallets: null });
    void loadAllowlist(allowlist);
  };
  const onRemove = () => {
    requestIdRef.current += 1;
    setLoadState("idle");
    onChange({ selectedAllowlist: null, emmaWallets: null });
  };
  const authenticationRequired =
    selectedId !== null &&
    sources.emmaWallets === null &&
    !connectedProfile?.handle;
  const hasLoadError =
    selectedId !== null &&
    sources.emmaWallets === null &&
    !!connectedProfile?.handle &&
    loadState === "error";
  const isLoadPending =
    selectedId !== null &&
    sources.emmaWallets === null &&
    !!connectedProfile?.handle &&
    loadState === "idle";
  const isLoading =
    selectedId !== null &&
    sources.emmaWallets === null &&
    !!connectedProfile?.handle &&
    loadState === "loading";

  return (
    <section className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/60 tw-p-3 sm:tw-p-4">
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "waves.create.groups.inlineIdentities.sources.emma.title")}
      </h3>
      <p className="tw-mb-3 tw-mt-1 tw-text-xs tw-leading-relaxed tw-text-iron-500">
        {t(
          locale,
          "waves.create.groups.inlineIdentities.sources.emma.description"
        )}
      </p>
      <EmmaListSearch
        selectedId={selectedId}
        selectedName={sources.selectedAllowlist?.name ?? null}
        onSelect={onSelect}
        label={t(
          locale,
          "waves.create.groups.inlineIdentities.sources.emma.searchLabel"
        )}
        loadingLabel={t(
          locale,
          "waves.create.groups.inlineIdentities.sources.emma.searchLoading"
        )}
        noResultsLabel={t(
          locale,
          "waves.create.groups.inlineIdentities.sources.emma.searchEmpty"
        )}
      />
      <div className="tw-mt-3 tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-3">
        {selectedId === null ? (
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-500">
            {t(
              locale,
              "waves.create.groups.inlineIdentities.sources.emma.empty"
            )}
          </p>
        ) : null}
        {isLoading ? (
          <p
            role="status"
            className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400"
          >
            {t(
              locale,
              "waves.create.groups.inlineIdentities.sources.emma.loading"
            )}
          </p>
        ) : null}
        {isLoadPending ? (
          <button
            type="button"
            onClick={() => {
              if (sources.selectedAllowlist) {
                void loadAllowlist(sources.selectedAllowlist);
              }
            }}
            className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(
              locale,
              "waves.create.groups.inlineIdentities.sources.emma.load"
            )}
          </button>
        ) : null}
        {authenticationRequired || hasLoadError ? (
          <div role="alert" className="tw-min-w-0">
            <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-error">
              {t(
                locale,
                authenticationRequired
                  ? "waves.create.groups.inlineIdentities.sources.emma.authenticationRequired"
                  : "waves.create.groups.inlineIdentities.sources.emma.error"
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                if (sources.selectedAllowlist) {
                  void loadAllowlist(sources.selectedAllowlist);
                }
              }}
              className="tw-mt-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {t(locale, "waves.create.groups.inlineIdentities.sources.retry")}
            </button>
          </div>
        ) : null}
        {sources.emmaWallets !== null ? (
          <SourceCount
            count={sources.emmaWallets.length}
            sourceName={sources.selectedAllowlist?.name}
          />
        ) : null}
        {selectedId !== null ? (
          <RemoveSourceButton
            label={t(
              locale,
              "waves.create.groups.inlineIdentities.sources.emma.remove"
            )}
            onClick={onRemove}
          />
        ) : null}
      </div>
    </section>
  );
}

function CsvWalletSource({
  direction,
  sources,
  onChange,
}: InlineWalletSourcesProps) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onRemove = () => {
    setErrorMessage(null);
    onChange({ uploadedWallets: null, uploadedFileName: null });
  };

  const readFile = (file: File) => {
    const isCsv =
      file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
    if (!isCsv) {
      setErrorMessage(
        t(
          locale,
          "waves.create.groups.inlineIdentities.sources.csv.invalidFile"
        )
      );
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMessage(
        t(locale, "waves.create.groups.inlineIdentities.sources.csv.readError")
      );
    };
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== "string") {
        setErrorMessage(
          t(
            locale,
            "waves.create.groups.inlineIdentities.sources.csv.readError"
          )
        );
        return;
      }
      const wallets = parseGroupWalletCsv(content);
      onChange({ uploadedWallets: wallets, uploadedFileName: file.name });
      if (wallets.length === 0) {
        setErrorMessage(
          t(
            locale,
            "waves.create.groups.inlineIdentities.sources.csv.noWallets"
          )
        );
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  };

  return (
    <section className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/60 tw-p-3 sm:tw-p-4">
      <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "waves.create.groups.inlineIdentities.sources.csv.title")}
      </h3>
      <p className="tw-mb-3 tw-mt-1 tw-text-xs tw-leading-relaxed tw-text-iron-500">
        {t(
          locale,
          "waves.create.groups.inlineIdentities.sources.csv.description"
        )}
      </p>
      <label
        htmlFor={inputId}
        onDrop={onDrop}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        className={`tw-flex tw-min-h-24 tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-dashed tw-p-3 tw-text-center tw-transition focus-within:tw-ring-2 focus-within:tw-ring-primary-400 ${
          isDragging
            ? "tw-border-primary-400 tw-bg-primary-500/10"
            : "desktop-hover:hover:tw-bg-iron-850 tw-border-white/10 tw-bg-iron-900 desktop-hover:hover:tw-border-white/20"
        }`}
      >
        <ArrowUpTrayIcon
          aria-hidden="true"
          className="tw-size-5 tw-text-iron-300"
        />
        <span className="tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-300">
          {t(
            locale,
            "waves.create.groups.inlineIdentities.sources.csv.dropLabel"
          )}
        </span>
        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          className="tw-sr-only"
          aria-label={t(
            locale,
            direction === "included"
              ? "waves.create.groups.inlineIdentities.sources.csv.includeInputLabel"
              : "waves.create.groups.inlineIdentities.sources.csv.excludeInputLabel"
          )}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              readFile(file);
            }
            event.target.value = "";
          }}
        />
      </label>
      {errorMessage ? (
        <p
          role="alert"
          className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-error"
        >
          {errorMessage}
        </p>
      ) : null}
      <div className="tw-mt-3 tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-3">
        {sources.uploadedWallets === null ? (
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-500">
            {t(
              locale,
              "waves.create.groups.inlineIdentities.sources.csv.empty"
            )}
          </p>
        ) : (
          <SourceCount
            count={sources.uploadedWallets.length}
            sourceName={sources.uploadedFileName ?? undefined}
          />
        )}
        {sources.uploadedWallets !== null ? (
          <RemoveSourceButton
            label={t(
              locale,
              "waves.create.groups.inlineIdentities.sources.csv.remove"
            )}
            onClick={onRemove}
          />
        ) : null}
      </div>
    </section>
  );
}

export default function CreateWaveInlineGroupWalletSources(
  props: InlineWalletSourcesProps
) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
      <EmmaWalletSource sources={props.sources} onChange={props.onChange} />
      <CsvWalletSource {...props} />
    </div>
  );
}
