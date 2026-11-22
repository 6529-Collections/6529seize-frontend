import type {
  MentionAlias,
  MentionAliasInput,
  MentionAliasMember,
} from "@/entities/IMentionAlias";
import {
  aliasItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { ownersOfProfiles } from "@/lib/personal-records/record-owners";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
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

/** An alias as records key it: trimmed, without @, lowercase. */
const normalizeAlias = (alias: string): string =>
  alias.trim().replace(/^@/, "").toLowerCase();

/** The saved name of an alias, read before a rename or delete changes it. */
async function savedAliasName(id: string): Promise<string> {
  const alias = (await fetchMentionAliases()).find((item) => item.id === id);
  if (!alias) {
    throw new Error("This mention shortcut no longer exists. Reload the page.");
  }
  return normalizeAlias(alias.alias);
}

const aliasMembers = (body: MentionAliasInput): Promise<string[]> =>
  ownersOfProfiles(body.member_profile_ids);

/**
 * Creates a mention shortcut: today's route, or a private `alias` item.
 * Resolves null when only records were written; read the list again.
 */
export const createMentionAlias = (body: MentionAliasInput) =>
  savePersonalSetting<MentionAlias | null>({
    legacy: () =>
      commonApiPost<MentionAliasInput, MentionAlias>({
        endpoint: ENDPOINT,
        body,
      }),
    change: async () =>
      personalChange({
        items: [
          aliasItem(normalizeAlias(body.alias), await aliasMembers(body), {
            create: true,
          }),
        ],
      }),
    recordsResult: () => null,
  });

/** Updates a mention shortcut's members, its name, or both. */
export const updateMentionAlias = (id: string, body: MentionAliasInput) =>
  savePersonalSetting<MentionAlias | null, string>({
    legacy: () =>
      commonApiPut<MentionAliasInput, MentionAlias>({
        endpoint: `${ENDPOINT}/${id}`,
        body,
      }),
    snapshot: () => savedAliasName(id),
    change: async (previous) => {
      const alias = normalizeAlias(body.alias);
      const members = await aliasMembers(body);
      if (previous === alias) {
        return personalChange({ items: [aliasItem(alias, members)] });
      }
      // A rename: the new name takes the alias (and its id), then the old
      // name is unset, in this order in one record.
      return personalChange({
        items: [
          aliasItem(alias, members, { renamedFrom: previous }),
          aliasItem(previous, null),
        ],
      });
    },
    recordsResult: () => null,
  });

export const deleteMentionAlias = (id: string) =>
  savePersonalSetting<void, string>({
    legacy: () => commonApiDelete({ endpoint: `${ENDPOINT}/${id}` }),
    snapshot: () => savedAliasName(id),
    change: (alias) => personalChange({ items: [aliasItem(alias, null)] }),
    recordsResult: () => undefined,
  });
