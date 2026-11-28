"use client";

import { CompactMenu } from "@/components/compact-menu";
import RoundedCsvIconButton from "@/components/distribution-plan-tool/common/RoundedCsvIconButton";
import RoundedJsonIconButton from "@/components/distribution-plan-tool/common/RoundedJsonIconButton";
import RoundedManifoldIconButton from "@/components/distribution-plan-tool/common/RoundedManifoldIconButton";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/emma";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import styles from "./ReviewDistributionPlanTable.module.css";
import { FetchResultsType } from "./ReviewDistributionPlanTable.types";

export function ReviewDistributionExports({
  name,
  loading,
  disabled = false,
  onExport,
}: Readonly<{
  name?: string;
  loading: FetchResultsType | null;
  disabled?: boolean;
  onExport: (type: FetchResultsType) => void;
}>) {
  const locale = useBrowserLocale();
  const label = t(locale, "emma.review.exports");
  const accessibleName = name
    ? t(locale, "emma.review.exportsFor", { name })
    : label;
  return (
    <>
      <div
        className={clsx(
          styles["formatButtons"],
          "tw-flex tw-shrink-0 tw-items-center tw-gap-2"
        )}
      >
        <RoundedJsonIconButton
          label={t(locale, "emma.review.downloadFormat", { format: "JSON" })}
          loading={loading === FetchResultsType.JSON}
          onClick={() => onExport(FetchResultsType.JSON)}
          disabled={disabled}
        />
        <RoundedCsvIconButton
          label={t(locale, "emma.review.downloadFormat", { format: "CSV" })}
          loading={loading === FetchResultsType.CSV}
          onClick={() => onExport(FetchResultsType.CSV)}
          disabled={disabled}
        />
        <RoundedManifoldIconButton
          label={t(locale, "emma.review.downloadFormat", {
            format: "Manifold",
          })}
          loading={loading === FetchResultsType.MANIFOLD}
          onClick={() => onExport(FetchResultsType.MANIFOLD)}
          disabled={disabled}
        />
      </div>
      {!disabled && (
        <div className={styles["compactExports"]}>
          <CompactMenu
            aria-label={accessibleName}
            triggerAsChild
            trigger={
              <Button
                variant="secondary"
                size="sm"
                className={styles["narrowAction"]}
                loading={loading !== null}
                hideChildrenWhenLoading
              >
                <ArrowDownTrayIcon
                  className={styles["narrowActionIcon"]}
                  aria-hidden="true"
                />
                <span className={styles["actionLabel"]}>{label}</span>
                <ChevronDownIcon
                  className={clsx(styles["actionChevron"], "tw-size-3")}
                  aria-hidden="true"
                />
              </Button>
            }
            // File format and product names are the same across locales.
            items={[
              {
                id: FetchResultsType.JSON,
                label: "JSON",
                onSelect: () => onExport(FetchResultsType.JSON),
              },
              {
                id: FetchResultsType.CSV,
                label: "CSV",
                onSelect: () => onExport(FetchResultsType.CSV),
              },
              {
                id: FetchResultsType.MANIFOLD,
                label: "Manifold",
                onSelect: () => onExport(FetchResultsType.MANIFOLD),
              },
            ]}
          />
        </div>
      )}
    </>
  );
}
