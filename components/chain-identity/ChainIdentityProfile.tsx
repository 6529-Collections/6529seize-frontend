"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Hex } from "viem";
import type { Config } from "wagmi";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import Button from "@/components/utils/button/Button";
import { CLASSIFICATIONS } from "@/entities/IProfile";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import type { ChainIdentity } from "@/lib/chain-identity/gateway";
import { PROFILE_DOC_KEYS, type ProfileDoc } from "@/lib/chain-identity/profileDoc";
import {
  nextProfileFields,
  prepareProfileReplace,
  readCurrentProfile,
} from "@/lib/chain-identity/profileSave";
import type { StoredSessionKey } from "@/lib/chain-identity/sessionKey";
import ChainActionStatus from "./ChainActionStatus";
import {
  CHAIN_HINT_CLASS,
  CHAIN_INPUT_CLASS,
  CHAIN_LABEL_CLASS,
  ChainSection,
} from "./chainIdentityUi";
import { useChainAction } from "./useChainAction";

const EDITED = [
  PROFILE_DOC_KEYS.classification,
  PROFILE_DOC_KEYS.bio,
  PROFILE_DOC_KEYS.website,
  PROFILE_DOC_KEYS.avatar,
  PROFILE_DOC_KEYS.banner1,
  PROFILE_DOC_KEYS.banner2,
] as const;
type EditedKey = (typeof EDITED)[number];
type Draft = Record<EditedKey, string>;

const LABEL_KEYS = {
  classification: "chainIdentity.profile.classification",
  bio: "chainIdentity.profile.bio",
  website: "chainIdentity.profile.website",
  avatar: "chainIdentity.profile.avatar",
  banner1: "chainIdentity.profile.banner1",
  banner2: "chainIdentity.profile.banner2",
} as const;

const emptyDraft = (): Draft => ({
  classification: "",
  bio: "",
  website: "",
  avatar: "",
  banner1: "",
  banner2: "",
});

const draftOf = (doc: ProfileDoc | null): Draft => {
  const draft = emptyDraft();
  for (const key of EDITED) {
    draft[key] = doc?.fields.get(key) ?? "";
  }
  return draft;
};

/**
 * PROFILE_REPLACE: writes a new profile document with the edited fields and
 * every other field kept, stores it with the gateway, and points the
 * identity at it. This browser's session key signs when it has one.
 */
export default function ChainIdentityProfile({
  wallet,
  config,
  identity,
  sessionKey,
  onChanged,
}: {
  readonly wallet: Hex;
  readonly config: Config;
  readonly identity: ChainIdentity;
  readonly sessionKey: StoredSessionKey | null;
  readonly onChanged: () => void;
}) {
  const locale = useBrowserLocale();
  const current = useQuery({
    queryKey: [QueryKey.CHAIN_IDENTITY, "doc", identity.profile?.docCid ?? null],
    queryFn: ({ signal }) => readCurrentProfile(identity, signal),
    staleTime: 60_000,
  });
  // Only what the person changed; the rest reads from the current document.
  const [edits, setEdits] = useState<Partial<Draft>>({});
  const draft: Draft = { ...draftOf(current.data?.doc ?? null), ...edits };
  const action = useChainAction(() => {
    setEdits({});
    onChanged();
  });

  const set = (key: EditedKey, value: string) =>
    setEdits((previous) => ({ ...previous, [key]: value }));

  const start = () => {
    if (!current.data) {
      return;
    }
    const fields = nextProfileFields(current.data.doc, edits);
    void action.prepare(async (progress) => {
      const { draft: prepared, signer } = await prepareProfileReplace(
        identity,
        fields,
        {
          config,
          wallet,
          sessionKey,
          onWalletPrompt: progress.walletPrompt,
          onDocumentSigned: progress.preparing,
        }
      );
      return { draft: prepared, signer, payer: "identity" };
    });
  };

  const textField = (key: Exclude<EditedKey, "classification" | "bio">) => (
    <div key={key}>
      <label htmlFor={`chain-profile-${key}`} className={CHAIN_LABEL_CLASS}>
        {t(locale, LABEL_KEYS[key])}
      </label>
      <input
        id={`chain-profile-${key}`}
        className={CHAIN_INPUT_CLASS}
        value={draft[key]}
        autoComplete="off"
        disabled={action.busy || !current.data}
        onChange={(event) => set(key, event.target.value)}
      />
    </div>
  );

  return (
    <ChainSection
      id="chain-identity-profile"
      heading={t(locale, "chainIdentity.profile.heading")}
      body={t(locale, "chainIdentity.profile.body")}
    >
      {current.isError && (
        <p role="alert" className={`${CHAIN_HINT_CLASS} tw-mb-3`}>
          {t(locale, "chainIdentity.profile.readError")}
        </p>
      )}
      {current.data?.unreadable === true && (
        <p className={`${CHAIN_HINT_CLASS} tw-mb-3`}>
          {t(locale, "chainIdentity.profile.unreadable")}
        </p>
      )}
      <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <div>
          <label
            htmlFor="chain-profile-classification"
            className={CHAIN_LABEL_CLASS}
          >
            {t(locale, LABEL_KEYS.classification)}
          </label>
          <select
            id="chain-profile-classification"
            className={CHAIN_INPUT_CLASS}
            value={draft.classification}
            disabled={action.busy || !current.data}
            onChange={(event) => set("classification", event.target.value)}
          >
            <option value="">
              {t(locale, "chainIdentity.profile.classificationNone")}
            </option>
            {Object.values(ApiProfileClassification).map((value) => (
              <option key={value} value={value}>
                {CLASSIFICATIONS[value].title}
              </option>
            ))}
          </select>
        </div>
        {textField("website")}
        <div className="sm:tw-col-span-2">
          <label htmlFor="chain-profile-bio" className={CHAIN_LABEL_CLASS}>
            {t(locale, LABEL_KEYS.bio)}
          </label>
          <textarea
            id="chain-profile-bio"
            className={`${CHAIN_INPUT_CLASS} tw-min-h-24`}
            value={draft.bio}
            maxLength={2000}
            disabled={action.busy || !current.data}
            onChange={(event) => set("bio", event.target.value)}
          />
        </div>
        {textField("avatar")}
        {textField("banner1")}
        {textField("banner2")}
      </div>
      <div className="tw-mt-4">
        <Button
          variant="primary"
          size="md"
          disabled={action.busy || !current.data || action.state.kind === "confirm"}
          onClick={start}
        >
          {t(locale, "chainIdentity.profile.action")}
        </Button>
      </div>
      <ChainActionStatus
        state={action.state}
        onConfirm={() => void action.confirm()}
        onCancel={action.cancel}
      />
    </ChainSection>
  );
}
