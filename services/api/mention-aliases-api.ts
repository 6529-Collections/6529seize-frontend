import type {
  MentionAlias,
  MentionAliasInput,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPut,
} from "./common-api";

const ENDPOINT = "mention-aliases";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMentionAliasMember(value: unknown): value is MentionAliasMember {
  return (
    isRecord(value) &&
    typeof value["profile_id"] === "string" &&
    typeof value["handle"] === "string" &&
    (typeof value["pfp"] === "string" || value["pfp"] === null)
  );
}

function isMentionAlias(value: unknown): value is MentionAlias {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["alias"] === "string" &&
    Array.isArray(value["members"]) &&
    value["members"].every(isMentionAliasMember)
  );
}

export function normalizeMentionAliases(value: unknown): MentionAlias[] {
  return Array.isArray(value) ? value.filter(isMentionAlias) : [];
}

export const fetchMentionAliases = async (): Promise<MentionAlias[]> =>
  normalizeMentionAliases(
    await commonApiFetch<unknown>({ endpoint: ENDPOINT })
  );

export const createMentionAlias = (body: MentionAliasInput) =>
  commonApiPost<MentionAliasInput, MentionAlias>({ endpoint: ENDPOINT, body });

export const updateMentionAlias = (id: string, body: MentionAliasInput) =>
  commonApiPut<MentionAliasInput, MentionAlias>({
    endpoint: `${ENDPOINT}/${id}`,
    body,
  });

export const deleteMentionAlias = (id: string) =>
  commonApiDelete({ endpoint: `${ENDPOINT}/${id}` });
