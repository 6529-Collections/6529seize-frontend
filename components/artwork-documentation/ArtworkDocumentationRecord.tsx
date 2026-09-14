"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ApiArtworkDocumentationOperationOpEnum } from "@/generated/models/ApiArtworkDocumentationOperation";
import {
  ApiArtworkDocumentationAnswerStatusEnum,
  ApiArtworkDocumentationAnswerIntendedVisibilityEnum,
} from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { associateDocumentationSource } from "@/services/api/artwork-documentation-api";
import DocumentationAuthGate from "./DocumentationAuthGate";
import { ArtworkDocumentationRecordView } from "./ArtworkDocumentationWorkspace";
import { canEditDocumentationField } from "@/lib/artwork-documentation/capabilities";
import { documentationMediaProfiles } from "@/lib/artwork-documentation/catalogue";
export interface ArtworkDocumentationRecordHandle {
  onDropSubmitted(
    dropId: string
  ): Promise<{ linked: boolean; contextId: string; workId: string }>;
  flush(): Promise<boolean>;
}
export interface ArtworkDocumentationInfo {
  readonly title?: string | undefined;
  readonly caption?: string | undefined;
  readonly description?: string | undefined;
  readonly preferredCredit?: string | undefined;
  readonly tokenReferences?:
    | readonly {
        readonly id?: string;
        readonly chain_namespace: "eip155";
        readonly chain_id: string;
        readonly contract_address: string;
        readonly token_id: string;
        readonly token_standard: "erc721" | "erc1155";
        readonly relationship:
          | "represents_work"
          | "prior_mint"
          | "related_token";
        readonly source_url?: string;
        readonly note?: string;
      }[]
    | undefined;
  readonly externalIdentifiers?:
    | readonly {
        readonly id?: string;
        readonly namespace: string;
        readonly identifier: string;
        readonly uri?: string;
        readonly note?: string;
        readonly source_ids?: readonly string[];
      }[]
    | undefined;
}
interface ArtworkDocumentationRecordProps {
  readonly context: ApiArtworkDocumentationContext;
  readonly artworkInfo?: ArtworkDocumentationInfo | undefined;
  readonly initialMediaProfiles?: readonly string[] | undefined;
}

/** The same full record is reusable during submission, on an artwork page or afterward. */
const ArtworkDocumentationRecord = forwardRef<
  ArtworkDocumentationRecordHandle,
  ArtworkDocumentationRecordProps
>((props, ref) => (
  <DocumentationAuthGate>
    <RecordEditor
      ref={ref}
      initial={props.context}
      sourceProposal={props.artworkInfo}
      initialMediaProfiles={props.initialMediaProfiles}
    />
  </DocumentationAuthGate>
));
ArtworkDocumentationRecord.displayName = "ArtworkDocumentationRecord";

const RecordEditor = forwardRef<
  ArtworkDocumentationRecordHandle,
  {
    readonly initial: ApiArtworkDocumentationContext;
    readonly sourceProposal: ArtworkDocumentationInfo | undefined;
    readonly initialMediaProfiles?: readonly string[] | undefined;
  }
>(({ initial, sourceProposal, initialMediaProfiles }, ref) => {
  const draft = useDocumentationDraft(initial);
  const { controller } = draft;
  const seeded = useRef(false);
  const sourceSeed = useRef(sourceProposal).current;
  const mediaSeed = useRef(initialMediaProfiles).current;
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const answer = (value: unknown) => ({
      status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
      value,
      intended_visibility:
        ApiArtworkDocumentationAnswerIntendedVisibilityEnum.PublicRecord,
    });
    const canSeed = (moduleId: string, field: string) =>
      !initial.modules[moduleId]?.answers[field] &&
      canEditDocumentationField(initial, `${moduleId}.${field}`, false);
    if (sourceSeed?.title && canSeed("artwork", "title"))
      controller.edit("artwork", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "title",
        answer: answer(sourceSeed.title),
      });
    if (sourceSeed?.preferredCredit && canSeed("identity", "preferred_credit"))
      controller.edit("identity", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "preferred_credit",
        answer: answer(sourceSeed.preferredCredit),
      });
    for (const [field, entries] of [
      ["token_references", sourceSeed?.tokenReferences],
      ["external_identifiers", sourceSeed?.externalIdentifiers],
    ] as const) {
      if (entries && entries.length > 0 && canSeed("artwork", field))
        controller.edit("artwork", {
          op: ApiArtworkDocumentationOperationOpEnum.Set,
          field,
          answer: answer(
            entries.map((entry) => ({
              ...entry,
              id: entry.id ?? crypto.randomUUID(),
            }))
          ),
        });
    }
    const caption = sourceSeed?.caption ?? sourceSeed?.description;
    if (caption && canSeed("context", "caption"))
      controller.edit("context", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "caption",
        answer: answer({
          primary_language: "en",
          versions: [
            {
              language: "en",
              text: caption,
              authorship: "original",
              approved_by_artist: false,
            },
          ],
        }),
      });
    const allowedMedia = documentationMediaProfiles(initial.profile).map(
      (profile) => profile.id
    );
    const selectedMedia = [
      ...new Set(
        mediaSeed?.filter((media) => allowedMedia.includes(media)) ?? []
      ),
    ];
    if (selectedMedia.length && canSeed("artwork", "media_profiles"))
      controller.edit("artwork", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "media_profiles",
        answer: answer(selectedMedia),
      });
    return () => {
      seeded.current = false;
    };
  }, [controller, sourceSeed, mediaSeed, initial]);
  useImperativeHandle(
    ref,
    () => ({
      flush: () => controller.flush(),
      onDropSubmitted: async (dropId) => {
        const linked = await controller.mutate((current, signal) =>
          associateDocumentationSource(
            current.id,
            dropId,
            current.draft_version,
            signal
          )
        );
        const current = controller.snapshot().context;
        return { linked, contextId: current.id, workId: current.work_id };
      },
    }),
    [controller]
  );
  return <ArtworkDocumentationRecordView draft={draft} embedded />;
});
RecordEditor.displayName = "ArtworkDocumentationRecordEditor";

export default ArtworkDocumentationRecord;
