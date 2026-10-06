"use client";

import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { WaveCompetitionEntries } from "@/components/waves/drops/WaveCompetitionEntries";
import type { WaveCompetitionPreviewTab } from "@/components/waves/drops/WaveCompetitionBadges";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import MySubmissionsDialog from "./MySubmissionsDialog";
import MySubmissionsButton from "./MySubmissionsButton";
import SubmissionConfirmation from "./SubmissionConfirmation";

function WaveSubmissionReceipt({
  drop,
  wave,
  onDismiss,
  onViewEntry,
}: {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
  readonly onDismiss: () => void;
  readonly onViewEntry: (drop: ApiDrop) => void;
}) {
  const query = useQuery<ApiDropV2View>({
    queryKey: [
      QueryKey.DROP,
      {
        drop_id: drop.id,
        wave_id: wave.id,
        author_id: drop.author.id,
        scope: "submission-confirmation",
      },
    ],
    queryFn: ({ signal }) => fetchDropV2ById(drop.id, signal),
    retry: false,
  });
  const saved = query.data;
  const confirmed =
    !query.isError &&
    saved?.id === drop.id &&
    saved.wave.id === wave.id &&
    saved.author.id === drop.author.id &&
    (saved.submission_context?.status === ApiSubmissionDropStatus.Active ||
      saved.submission_context?.status === ApiSubmissionDropStatus.Winner);
  return (
    <SubmissionConfirmation
      competitionName={wave.name}
      confirmed={confirmed}
      checking={query.isFetching}
      onViewEntry={() => onViewEntry(drop)}
      onCheckAgain={() => {
        void query.refetch();
      }}
      onDismiss={onDismiss}
    />
  );
}

export default function WaveMySubmissions({
  wave,
  receiptDrop,
  onDismissReceipt,
  renderHeader,
}: {
  readonly wave: ApiWave;
  readonly receiptDrop: ApiDrop | null;
  readonly onDismissReceipt: () => void;
  readonly renderHeader?: ((trigger: ReactNode) => ReactNode) | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const locale = useBrowserLocale();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<WaveCompetitionPreviewTab>("active");
  const authorId = connectedProfile?.id;
  if (!authorId || activeProfileProxy) return renderHeader?.(null) ?? null;
  const onViewEntry = (drop: ApiDrop) => {
    const params = new URLSearchParams(search.toString());
    params.set("drop", drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    globalThis.window.dispatchEvent(new CustomEvent("single-drop:close-chat"));
    setIsOpen(false);
  };
  const showReceipt =
    receiptDrop?.wave.id === wave.id &&
    receiptDrop.author.id === authorId &&
    receiptDrop.drop_type === ApiDropType.Participatory;
  const trigger = (
    <MySubmissionsButton onClick={() => setIsOpen(true)}>
      {t(locale, "waves.submissions.mine")}
    </MySubmissionsButton>
  );
  return (
    <>
      {renderHeader ? renderHeader(trigger) : trigger}
      {showReceipt && (
        <WaveSubmissionReceipt
          key={receiptDrop.id}
          drop={receiptDrop}
          wave={wave}
          onDismiss={onDismissReceipt}
          onViewEntry={onViewEntry}
        />
      )}
      <MySubmissionsDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        competitionName={wave.name}
      >
        {(isApp) => (
          <>
            <fieldset
              className="tw-m-0 tw-mb-4 tw-flex tw-min-w-0 tw-flex-wrap tw-gap-2 tw-border-0 tw-p-0"
              aria-label={t(locale, "waves.submissions.mine")}
            >
              {(["active", "winners"] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={kind === tab ? "primary" : "secondary"}
                  size="sm"
                  aria-pressed={kind === tab}
                  onClick={() => setKind(tab)}
                >
                  {t(
                    locale,
                    tab === "active"
                      ? "waves.competitionBadges.tabs.active"
                      : "waves.competitionBadges.tabs.winners"
                  )}
                </Button>
              ))}
            </fieldset>
            <WaveCompetitionEntries
              authorId={authorId}
              wave={toApiWaveMin(wave)}
              kind={kind}
              isOpen={isOpen}
              isApp={isApp}
              onDropClick={onViewEntry}
            />
          </>
        )}
      </MySubmissionsDialog>
    </>
  );
}
