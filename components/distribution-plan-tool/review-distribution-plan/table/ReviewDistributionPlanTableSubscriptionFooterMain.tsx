"use client";

import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import type { DistributionOverview } from "@/generated/models/DistributionOverview";
import type { DistributionPhoto } from "@/generated/models/DistributionPhoto";
import type { PhaseAirdrop } from "@/generated/models/PhaseAirdrop";
import { formatAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, selectPluralCategory } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import Image from "next/image";
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from "react";
import {
  type DistributionAirdropsPhase,
  DistributionPhaseAirdropsModal,
} from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdrops";
import { ConfirmTokenIdModal } from "./ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId";
import { DistributionPhaseAirdropsViewerModal } from "./ReviewDistributionPlanTableSubscriptionFooterPhaseAirdropsViewer";
import {
  GithubUploadModal,
  type GithubUploadResult,
} from "./ReviewDistributionPlanTableSubscriptionFooterGithubUploadModal";
import { DistributionPhotosViewerModal } from "./ReviewDistributionPlanTableSubscriptionFooterPhotosViewer";
import { UploadDistributionPhotosModal } from "./ReviewDistributionPlanTableSubscriptionFooterUploadPhotos";

function getPublishBlockReason(
  overview: DistributionOverview | null
): MessageKey | null {
  if (!overview?.is_normalized) return "emma.review.publishNeedsFinalization";
  if (overview.photos_count <= 0) return "emma.review.publishNeedsPhotos";
  const airdrops =
    overview.artist_airdrops_count + overview.team_airdrops_count;
  if (airdrops <= 0) return "emma.review.publishNeedsAirdrops";
  return null;
}

const footerSectionClass =
  "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-4";
const footerHeadingClass =
  "tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100";
const footerActionRowClass =
  "tw-grid tw-gap-x-4 tw-gap-y-2 @[42rem]:tw-grid-cols-[minmax(0,1fr)_minmax(24rem,58%)]";
const footerActionsClass =
  "tw-grid tw-items-start tw-gap-2 @[42rem]:tw-grid-cols-2";

function StableLabel({
  busy,
  busyLabel,
  children,
}: Readonly<{ busy: boolean; busyLabel: string; children: ReactNode }>) {
  return (
    <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
      <span
        className={`tw-inline-flex tw-items-center tw-justify-center tw-gap-2 ${busy ? "tw-invisible" : ""}`}
      >
        {children}
      </span>
      {busy && (
        <span className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-gap-1.5">
          <CircleLoader />
          {busyLabel}
        </span>
      )}
    </span>
  );
}

function AssetRow({
  label,
  count,
  loadingCount,
  viewing,
  uploading,
  uploadDisabled = false,
  onView,
  onUpload,
  download,
}: Readonly<{
  label: string;
  count: string;
  loadingCount: boolean;
  viewing: boolean;
  uploading: boolean;
  uploadDisabled?: boolean;
  onView: () => void;
  onUpload: () => void;
  download?: ReactNode;
}>) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-4 tw-gap-y-2 tw-py-2.5 @[36rem]:tw-grid-cols-[minmax(0,1fr)_minmax(9rem,24%)_auto]">
      <span className="tw-text-sm tw-font-medium tw-text-iron-100">
        {label}
      </span>
      <span className="tw-justify-self-end tw-text-right tw-text-sm tw-tabular-nums tw-text-iron-400 @[36rem]:tw-justify-self-start @[36rem]:tw-text-left">
        {loadingCount ? "…" : count}
      </span>
      <div className="tw-col-span-2 tw-grid tw-grid-cols-[3.5rem_5.5rem_2.25rem] tw-gap-2 @[36rem]:tw-col-span-1">
        <Button
          variant="ghost"
          size="sm"
          className="tw-text-iron-200"
          loading={viewing}
          hideChildrenWhenLoading
          aria-label={t(locale, "emma.review.viewAsset", { asset: label })}
          aria-haspopup="dialog"
          onClick={onView}
        >
          {t(locale, "emma.review.view")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={uploadDisabled}
          loading={uploading}
          hideChildrenWhenLoading
          aria-label={t(locale, "emma.review.uploadAsset", { asset: label })}
          aria-haspopup="dialog"
          onClick={onUpload}
        >
          <FontAwesomeIcon icon={faUpload} className="tw-size-3.5" />
          {t(locale, "emma.review.upload")}
        </Button>
        {download}
      </div>
    </div>
  );
}

function formatAssetCount(
  locale: SupportedLocale,
  one: MessageKey,
  other: MessageKey,
  count: number
): string {
  return t(
    locale,
    selectPluralCategory(locale, count) === "one" ? one : other,
    {
      count: formatInteger(locale, count),
    }
  );
}

function AirdropAssetRow({
  phase,
  overview,
  loadingCount,
  downloading,
  onDownload,
  ...assetActions
}: Readonly<{
  phase: DistributionAirdropsPhase;
  overview: DistributionOverview | null;
  downloading: boolean;
  onDownload: () => void;
}> &
  Pick<
    ComponentProps<typeof AssetRow>,
    | "loadingCount"
    | "viewing"
    | "uploading"
    | "uploadDisabled"
    | "onView"
    | "onUpload"
  >) {
  const locale = useBrowserLocale();
  const isArtist = phase === "artist";
  const label = t(
    locale,
    isArtist ? "emma.review.assetArtist" : "emma.review.assetTeam"
  );
  const addresses =
    (isArtist
      ? overview?.artist_airdrops_addresses
      : overview?.team_airdrops_addresses) ?? 0;
  const count =
    (isArtist
      ? overview?.artist_airdrops_count
      : overview?.team_airdrops_count) ?? 0;
  const downloadLabel = t(locale, "emma.review.downloadAsset", {
    asset: label,
  });

  return (
    <AssetRow
      {...assetActions}
      label={label}
      count={t(locale, "emma.review.assetCount", {
        wallets: formatAssetCount(
          locale,
          "emma.review.walletsOne",
          "emma.review.walletsOther",
          addresses
        ),
        tokens: formatAssetCount(
          locale,
          "emma.review.tokensOne",
          "emma.review.tokensOther",
          count
        ),
      })}
      loadingCount={loadingCount}
      download={
        <Button
          variant="secondary"
          size="sm"
          className="tw-w-9"
          onClick={onDownload}
          disabled={loadingCount || count === 0}
          loading={downloading}
          hideChildrenWhenLoading
          aria-label={downloadLabel}
          title={downloadLabel}
        >
          <FontAwesomeIcon icon={faDownload} className="tw-size-3.5" />
        </Button>
      }
    />
  );
}

function PreparationSection({
  choice,
  processingControl,
  status,
}: Readonly<{
  choice: ReactElement | undefined;
  processingControl: ReactElement | undefined;
  status: string | undefined;
}>) {
  const locale = useBrowserLocale();
  const [showPreparationHelp, setShowPreparationHelp] = useState(false);

  return (
    <>
      <section
        aria-label={t(locale, "emma.review.prepare")}
        className={footerSectionClass}
      >
        <div className={footerActionRowClass}>
          <div className="tw-flex tw-min-h-11 tw-items-center tw-gap-1">
            <h3 className={footerHeadingClass}>
              {t(locale, "emma.review.prepare")}
            </h3>
            <Button
              variant="ghost"
              size="xs"
              className="tw-w-8"
              aria-label={t(locale, "emma.review.preparationHelp")}
              aria-haspopup="dialog"
              title={t(locale, "emma.review.preparationHelp")}
              onClick={() => setShowPreparationHelp(true)}
            >
              <InformationCircleIcon className="tw-size-5" aria-hidden="true" />
            </Button>
          </div>
          {(choice !== undefined || processingControl !== undefined) && (
            <div className={footerActionsClass}>
              {choice}
              {processingControl !== undefined && (
                <div className="tw-min-w-0 @[42rem]:tw-col-start-2">
                  {processingControl}
                </div>
              )}
            </div>
          )}
        </div>
        {status && (
          <output className="tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
            {status}
          </output>
        )}
      </section>
      <Dialog
        open={showPreparationHelp}
        onClose={setShowPreparationHelp}
        className="tailwind-scope tw-relative tw-z-[1100]"
      >
        <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-black/70" />
        <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-p-4">
          <DialogPanel className="tw-max-h-full tw-w-full tw-max-w-lg tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-shadow-2xl">
            <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between tw-gap-4">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
                {t(locale, "emma.review.prepare")}
              </DialogTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPreparationHelp(false)}
                data-autofocus
              >
                {t(locale, "common.close")}
              </Button>
            </div>
            <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-text-sm tw-leading-6 tw-text-iron-300">
              <div>
                <dt className="tw-font-semibold">
                  {t(locale, "dropForge.prepareManually")}
                </dt>
                <dd className="tw-m-0">
                  {t(locale, "emma.review.manualHelp")}
                </dd>
              </div>
              <div>
                <dt className="tw-font-semibold">
                  {t(locale, "dropForge.process")}
                </dt>
                <dd className="tw-m-0">
                  {t(locale, "emma.review.backgroundHelp")}
                </dd>
              </div>
              <div>
                <dt className="tw-font-semibold">
                  {t(locale, "emma.review.reset")}
                </dt>
                <dd className="tw-m-0">{t(locale, "emma.review.resetHelp")}</dd>
              </div>
            </dl>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

export function SubscriptionFooterMain({
  contract,
  confirmedTokenId,
  distributionPlan,
  overview,
  isLoadingOverview,
  isResetting,
  isUploading,
  uploadingAirdropsPhase,
  downloadingAirdropsPhases,
  isFinalizing,
  isUploadingToGithub,
  showGithubModal,
  githubUploadResult,
  githubUploadError,
  showConfirmTokenId,
  showUploadPhotos,
  showViewPhotos,
  showUploadAirdropsPhase,
  showViewAirdropsPhase,
  viewedPhotos,
  viewedPhotosError,
  viewedAirdrops,
  viewedAirdropsError,
  viewingPhotos,
  viewingAirdropsPhase,
  onConfirmTokenId,
  onChangeTokenId,
  onResetSubscriptions,
  onShowUploadAirdrops,
  onShowViewAirdrops,
  onShowUploadPhotos,
  onShowViewPhotos,
  onDownloadAirdrops,
  preparationChoice,
  processingControl,
  preparationStatus,
  showManualFinalize,
  onFinalize,
  onUploadToGithub,
  onCloseGithubModal,
  onUploadPhotos,
  onUploadAirdrops,
  onCloseUploadPhotos,
  onCloseViewPhotos,
  onCloseUploadAirdrops,
  onCloseViewAirdrops,
}: Readonly<{
  contract: string;
  confirmedTokenId: string;
  distributionPlan: AllowlistDescription | null;
  overview: DistributionOverview | null;
  isLoadingOverview: boolean;
  isResetting: boolean;
  isUploading: boolean;
  uploadingAirdropsPhase: DistributionAirdropsPhase | null;
  downloadingAirdropsPhases: Record<DistributionAirdropsPhase, boolean>;
  isFinalizing: boolean;
  isUploadingToGithub: boolean;
  showGithubModal: boolean;
  githubUploadResult: GithubUploadResult | null;
  githubUploadError: string | null;
  showConfirmTokenId: boolean;
  showUploadPhotos: boolean;
  showViewPhotos: boolean;
  showUploadAirdropsPhase: DistributionAirdropsPhase | null;
  showViewAirdropsPhase: DistributionAirdropsPhase | null;
  viewedPhotos: DistributionPhoto[];
  viewedPhotosError: string | null;
  viewedAirdrops: PhaseAirdrop[];
  viewedAirdropsError: string | null;
  viewingPhotos: boolean;
  viewingAirdropsPhase: DistributionAirdropsPhase | null;
  onConfirmTokenId: (tokenId: string) => void;
  onChangeTokenId: () => void;
  onResetSubscriptions: () => void;
  onShowUploadAirdrops: (phase: DistributionAirdropsPhase) => void;
  onShowViewAirdrops: (phase: DistributionAirdropsPhase) => void;
  onShowUploadPhotos: () => void;
  onShowViewPhotos: () => void;
  onDownloadAirdrops: (phase: DistributionAirdropsPhase) => void;
  preparationChoice?: ReactElement | undefined;
  processingControl?: ReactElement | undefined;
  preparationStatus?: string | undefined;
  showManualFinalize: boolean;
  onFinalize: () => void;
  onUploadToGithub: () => void;
  onCloseGithubModal: () => void;
  onUploadPhotos: (
    contract: string,
    tokenId: string,
    files: File[]
  ) => Promise<void>;
  onUploadAirdrops: (
    contract: string,
    tokenId: string,
    phase: DistributionAirdropsPhase,
    csvContent: string
  ) => Promise<boolean>;
  onCloseUploadPhotos: () => void;
  onCloseViewPhotos: () => void;
  onCloseUploadAirdrops: () => void;
  onCloseViewAirdrops: () => void;
}>) {
  const locale = useBrowserLocale();
  const publishStatusId = useId();
  const photoCount = overview?.photos_count ?? 0;
  const publishBlockReason = getPublishBlockReason(overview);
  const publishStatusKey = isLoadingOverview
    ? "emma.review.checkingDistribution"
    : publishBlockReason;

  return (
    <div className="tw-min-w-0 tw-py-3 tw-@container">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-pb-4">
        <span className="tw-text-sm tw-text-iron-400">
          {t(locale, "emma.review.contractAndToken", {
            contract: formatAddress(contract),
            tokenId: confirmedTokenId,
          })}
        </span>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <Button variant="secondary" size="sm" onClick={onChangeTokenId}>
            {t(locale, "emma.review.changeToken")}
          </Button>
          <Button
            variant="destructiveOutline"
            size="sm"
            onClick={onResetSubscriptions}
            aria-busy={isResetting}
            disabled={isResetting}
          >
            <StableLabel
              busy={isResetting}
              busyLabel={t(locale, "emma.review.resetting")}
            >
              {t(locale, "emma.review.reset")}
            </StableLabel>
          </Button>
        </div>
      </div>
      <section
        aria-label={t(locale, "emma.review.assets")}
        className={footerSectionClass}
      >
        <h3 className={footerHeadingClass}>
          {t(locale, "emma.review.assets")}
        </h3>
        <div className="tw-mt-2 tw-divide-y tw-divide-solid tw-divide-white/10">
          {(["artist", "team"] as const).map((phase) => (
            <AirdropAssetRow
              key={phase}
              phase={phase}
              overview={overview}
              loadingCount={isLoadingOverview}
              viewing={viewingAirdropsPhase === phase}
              uploading={uploadingAirdropsPhase === phase}
              uploadDisabled={uploadingAirdropsPhase !== null}
              downloading={downloadingAirdropsPhases[phase]}
              onView={() => onShowViewAirdrops(phase)}
              onUpload={() => onShowUploadAirdrops(phase)}
              onDownload={() => onDownloadAirdrops(phase)}
            />
          ))}
          <AssetRow
            label={t(locale, "emma.review.assetPhotos")}
            count={formatAssetCount(
              locale,
              "emma.review.photosOne",
              "emma.review.photosOther",
              photoCount
            )}
            loadingCount={isLoadingOverview}
            viewing={viewingPhotos}
            uploading={isUploading}
            onView={onShowViewPhotos}
            onUpload={onShowUploadPhotos}
          />
        </div>
      </section>
      <PreparationSection
        choice={preparationChoice}
        processingControl={processingControl}
        status={preparationStatus}
      />
      <section
        aria-label={t(
          locale,
          showManualFinalize ? "emma.review.finish" : "emma.review.publish"
        )}
        className={footerSectionClass}
      >
        <div className={footerActionRowClass}>
          <div className="tw-flex tw-min-h-11 tw-flex-col tw-justify-center tw-gap-1">
            <h3 className={footerHeadingClass}>
              {t(
                locale,
                showManualFinalize
                  ? "emma.review.finish"
                  : "emma.review.publish"
              )}
            </h3>
            {publishStatusKey && (
              <p
                id={publishStatusId}
                className="tw-m-0 tw-text-sm tw-text-iron-400"
              >
                {t(locale, publishStatusKey)}
              </p>
            )}
          </div>
          <div className={footerActionsClass}>
            {showManualFinalize && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={onFinalize}
                disabled={isFinalizing || isResetting}
                aria-busy={isFinalizing}
              >
                <StableLabel
                  busy={isFinalizing}
                  busyLabel={t(locale, "emma.review.finalizing")}
                >
                  {t(locale, "emma.review.finalize")}
                  {overview?.is_normalized && (
                    <CheckCircleIcon
                      className="tw-size-4 tw-text-emerald-400"
                      aria-label={t(locale, "emma.review.finalized")}
                    />
                  )}
                </StableLabel>
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onUploadToGithub}
              disabled={
                isUploadingToGithub ||
                isResetting ||
                isLoadingOverview ||
                publishBlockReason !== null
              }
              aria-busy={isUploadingToGithub}
              aria-describedby={publishStatusKey ? publishStatusId : undefined}
              className="@[42rem]:tw-col-start-2"
            >
              <StableLabel
                busy={isUploadingToGithub}
                busyLabel={t(locale, "emma.review.publishing")}
              >
                <Image
                  src="/github.png"
                  alt=""
                  width={18}
                  height={18}
                  unoptimized
                  className="tw-shrink-0 tw-invert"
                />
                {t(locale, "emma.review.publishToGithub")}
              </StableLabel>
            </Button>
          </div>
        </div>
      </section>
      <GithubUploadModal
        show={showGithubModal}
        onClose={onCloseGithubModal}
        onRetry={onUploadToGithub}
        isLoading={isUploadingToGithub}
        result={githubUploadResult}
        apiError={githubUploadError}
      />
      {distributionPlan && (
        <>
          {showConfirmTokenId && (
            <ConfirmTokenIdModal
              plan={distributionPlan}
              onConfirm={onConfirmTokenId}
            />
          )}
          {showUploadPhotos && (
            <UploadDistributionPhotosModal
              plan={distributionPlan}
              handleClose={onCloseUploadPhotos}
              existingPhotosCount={overview?.photos_count ?? 0}
              confirmedTokenId={confirmedTokenId}
              onUpload={onUploadPhotos}
            />
          )}
          {showViewPhotos && (
            <DistributionPhotosViewerModal
              confirmedTokenId={confirmedTokenId}
              photos={viewedPhotos}
              isLoading={viewingPhotos}
              error={viewedPhotosError}
              handleClose={onCloseViewPhotos}
            />
          )}
          {showUploadAirdropsPhase !== null && (
            <DistributionPhaseAirdropsModal
              plan={distributionPlan}
              phase={showUploadAirdropsPhase}
              isUploading={uploadingAirdropsPhase === showUploadAirdropsPhase}
              handleClose={onCloseUploadAirdrops}
              confirmedTokenId={confirmedTokenId}
              onUpload={onUploadAirdrops}
            />
          )}
          {showViewAirdropsPhase !== null && (
            <DistributionPhaseAirdropsViewerModal
              phase={showViewAirdropsPhase}
              confirmedTokenId={confirmedTokenId}
              rows={viewedAirdrops}
              isLoading={viewingAirdropsPhase === showViewAirdropsPhase}
              error={viewedAirdropsError}
              handleClose={onCloseViewAirdrops}
            />
          )}
        </>
      )}
    </div>
  );
}
