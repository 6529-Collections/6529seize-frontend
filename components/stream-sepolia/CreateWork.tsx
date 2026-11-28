"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Address } from "viem";

import CommonBorderedRadioButton from "@/components/utils/radio/CommonBorderedRadioButton";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import { draftReady, parseCap, type Draft } from "@/lib/stream/createDraft";
import { LISTING_ACTIVE } from "@/lib/stream/independent";
import { getStreamInstance } from "@/lib/stream/instances";

import { LINK } from "./createShared";
import { CuratedRun, type CreatedWork } from "./CuratedRun";
import { artistContracts, DeployContract, DeployEditionsContract } from "./DeployContract";
import { formatCount, shortAddress } from "./format";
import { IndependentRun } from "./IndependentRun";
import { CARD } from "./OneOfOnePanel";
import { RecentWorks } from "./RecentWorks";
import { STREAM_BASE, workHref } from "./StreamNav";
import { StreamLoading } from "./StreamLoading";
import { useMyCollections } from "./useStreamData";
import { useStreamWallet, WalletGate } from "./WalletGate";
import { EMPTY_DRAFT, WorkForm } from "./WorkForm";
import { WorkPreview } from "./WorkPreview";

type Door = "stream" | "independent";

function reviewLine(draft: Draft, locale: SupportedLocale): string {
  if (!draft.editions) return t(locale, "streamSepolia.create.reviewOne");
  const cap = parseCap(draft.cap) ?? 0;
  return t(locale, "streamSepolia.create.reviewEditions", {
    cap: cap > 0 ? formatCount(cap, locale) : t(locale, "streamSepolia.create.noCap"),
  });
}

/** The two things this page does, 6529 Stream first. */
function Doors({
  value,
  onChange,
  contractName,
}: {
  readonly value: Door;
  readonly onChange: (door: Door) => void;
  /** The artist's own contract, once deployed: its door then creates in it. */
  readonly contractName: string | null;
}) {
  const locale = useBrowserLocale();
  const curatedOpen = getStreamInstance().curatedCreationOpen;
  const doors: { id: Door; title: string; help: string; disabled: boolean }[] = [
    {
      id: "stream",
      title: t(locale, "streamSepolia.door.stream"),
      help: curatedOpen ? t(locale, "streamSepolia.door.streamHelp") : t(locale, "streamSepolia.create.streamClosed"),
      disabled: !curatedOpen,
    },
    {
      id: "independent",
      title: contractName
        ? t(locale, "streamSepolia.door.inContract", { name: contractName })
        : t(locale, "streamSepolia.door.deploy"),
      help: contractName ? t(locale, "streamSepolia.door.inContractHelp") : t(locale, "streamSepolia.door.deployHelp"),
      disabled: false,
    },
  ];
  return (
    <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
      <legend className="tw-sr-only">{t(locale, "streamSepolia.door.legend")}</legend>
      <div className="tw-grid tw-gap-3 md:tw-grid-cols-2">
        {doors.map((door) => (
          <CommonBorderedRadioButton
            key={door.id}
            type={door.id}
            selected={value}
            name="stream-door"
            variant="subtle"
            nativeSelection
            multiline
            disabled={door.disabled}
            onChange={onChange}
          >
            <span className="tw-block tw-text-base tw-font-semibold tw-text-iron-50">{door.title}</span>
            <span className="tw-mt-1 tw-block tw-text-sm tw-font-normal tw-text-iron-400">{door.help}</span>
          </CommonBorderedRadioButton>
        ))}
      </div>
    </fieldset>
  );
}

function DoneCard({ work }: { readonly work: CreatedWork }) {
  const locale = useBrowserLocale();
  return (
    <section className={CARD} role="status">
      <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-emerald-400">{t(locale, "streamSepolia.create.done")}</p>
      <Link href={workHref(work)} className={`${LINK} tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold`}>
        {t(locale, "streamSepolia.create.viewWork")}
      </Link>
    </section>
  );
}

/**
 * Form beside a live preview, then the review with its steps. The form is
 * usable without a wallet; the wallet is asked for at the review, when the
 * steps are about to start.
 */
function CreateFlow({
  viewer,
  curated,
  product,
  editionsAvailable,
  aside,
  run,
}: {
  readonly viewer: Address | undefined;
  readonly curated: boolean;
  readonly product: string;
  readonly editionsAvailable: boolean;
  readonly aside?: ReactNode;
  readonly run: (args: { draft: Draft; viewer: Address; onDone: (work: CreatedWork) => void }) => ReactNode;
}) {
  const locale = useBrowserLocale();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState<CreatedWork | null>(null);
  const artistFallback = viewer ? shortAddress(viewer) : t(locale, "streamSepolia.preview.you");
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  let main: ReactNode;
  if (done) {
    main = <DoneCard work={done} />;
  } else if (reviewing) {
    main = (
      <section className={CARD} aria-labelledby="stream-create-review">
        <h2 id="stream-create-review" className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          {t(locale, "streamSepolia.create.reviewTitle", { title: draft.title.trim() })}
        </h2>
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">{reviewLine(draft, locale)}</p>
        <div className="tw-mt-4">
          <WalletGate reason={t(locale, "streamSepolia.create.connectToStart")}>
            {viewer ? run({ draft, viewer, onDone: setDone }) : null}
          </WalletGate>
        </div>
      </section>
    );
  } else {
    main = (
      <form
        className="tw-flex tw-flex-col tw-gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (draftReady(draft, curated)) setReviewing(true);
        }}
      >
        <WorkForm
          draft={draft}
          onChange={update}
          withRoyalty={!curated}
          editionsAvailable={editionsAvailable}
          artistPlaceholder={artistFallback}
        />
        <div>
          <Button type="submit" variant="action" size="md" disabled={!draftReady(draft, curated)}>
            {t(locale, "streamSepolia.create.review")}
          </Button>
        </div>
      </form>
    );
  }
  return (
    <div className="tw-grid tw-items-start tw-gap-8 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="tw-min-w-0">{main}</div>
      <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-sticky lg:tw-top-6">
        <WorkPreview draft={draft} product={product} artistFallback={artistFallback} />
        {aside}
      </div>
    </div>
  );
}

function StreamDoor({ viewer }: { readonly viewer: Address | undefined }) {
  const locale = useBrowserLocale();
  return (
    <CreateFlow
      viewer={viewer}
      curated
      product={t(locale, "streamSepolia.product.stream")}
      editionsAvailable
      run={({ draft, viewer: artist, onDone }) => <CuratedRun draft={draft} viewer={artist} onDone={onDone} />}
    />
  );
}

/** Without a contract: deploy it, in place. With one: create an NFT in it. */
function IndependentDoor({ viewer }: { readonly viewer: Address | undefined }) {
  const locale = useBrowserLocale();
  const collections = useMyCollections(viewer);
  if (!viewer) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-3">
        <DeployContract existing={null} />
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.door.haveContract")}</p>
      </div>
    );
  }
  if (collections.isLoading) return <StreamLoading onRetry={() => void collections.refetch()} />;
  const { oneOfOne, editions } = artistContracts(collections.data ?? []);
  if (oneOfOne?.status !== LISTING_ACTIVE) {
    return <DeployContract existing={oneOfOne} onDone={() => void collections.refetch()} />;
  }
  const editionsListed = editions?.status === LISTING_ACTIVE ? editions : null;
  return (
    <CreateFlow
      viewer={viewer}
      curated={false}
      product={t(locale, "streamSepolia.preview.inContract", { name: oneOfOne.name })}
      editionsAvailable={!!editionsListed}
      aside={editionsListed ? null : <DeployEditionsContract oneOfOne={oneOfOne} existing={editions} />}
      run={({ draft, viewer: artist, onDone }) => (
        <IndependentRun
          viewer={artist}
          token={oneOfOne.token}
          editionsToken={editionsListed?.token ?? null}
          draft={draft}
          onDone={onDone}
        />
      )}
    />
  );
}

export function CreateWork({ initialDoor }: { readonly initialDoor?: Door | undefined }) {
  const locale = useBrowserLocale();
  const wallet = useStreamWallet();
  const collections = useMyCollections(wallet.address);
  const curatedOpen = getStreamInstance().curatedCreationOpen;
  const [door, setDoor] = useState<Door>(initialDoor ?? (curatedOpen ? "stream" : "independent"));
  const { oneOfOne } = artistContracts(collections.data ?? []);
  const contractName = oneOfOne?.status === LISTING_ACTIVE ? oneOfOne.name : null;
  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <div>
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.create.title")}</h1>
        <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-text-iron-400">{t(locale, "streamSepolia.create.intro")}</p>
      </div>
      <Doors value={door} onChange={setDoor} contractName={contractName} />
      <p className="tw-m-0 tw-text-sm">
        <Link href={`${STREAM_BASE}/how-it-works`} className={LINK}>
          {t(locale, "streamSepolia.door.howItWorks")}
        </Link>
      </p>
      {door === "stream" ? <StreamDoor viewer={wallet.address} /> : <IndependentDoor viewer={wallet.address} />}
      <RecentWorks title={t(locale, "streamSepolia.recent.title")} />
    </div>
  );
}
