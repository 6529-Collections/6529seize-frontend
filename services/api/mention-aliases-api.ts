import type {
  MentionAlias,
  MentionAliasInput,
} from "@/entities/IMentionAlias";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPut,
} from "./common-api";

const ENDPOINT = "mention-aliases";

export const fetchMentionAliases = () =>
  commonApiFetch<MentionAlias[]>({ endpoint: ENDPOINT });

export const createMentionAlias = (body: MentionAliasInput) =>
  commonApiPost<MentionAliasInput, MentionAlias>({ endpoint: ENDPOINT, body });

export const updateMentionAlias = (id: string, body: MentionAliasInput) =>
  commonApiPut<MentionAliasInput, MentionAlias>({
    endpoint: `${ENDPOINT}/${id}`,
    body,
  });

export const deleteMentionAlias = (id: string) =>
  commonApiDelete({ endpoint: `${ENDPOINT}/${id}` });
