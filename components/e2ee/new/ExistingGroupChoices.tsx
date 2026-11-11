import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { getConversationTitle } from "../e2eeFormat";

export function ExistingGroupChoices({
  groups,
  chosenGroup,
  onChoose,
  selfProfileId,
}: {
  readonly groups: readonly E2eeConversation[];
  readonly chosenGroup: string | null;
  readonly onChoose: (groupId: string) => void;
  readonly selfProfileId: string | null;
}) {
  const locale = useBrowserLocale();
  const several = groups.length > 1;

  return (
    <fieldset className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-1.5 tw-border-0 tw-p-0">
      <legend className="tw-mb-1 tw-p-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {t(locale, several ? "e2ee.new.matches.many" : "e2ee.new.matches.one")}
      </legend>
      {groups.map((group) => {
        const Row = several ? "label" : "div";
        return (
          <Row
            key={group.g}
            className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100"
          >
            {several && (
              <input
                type="radio"
                name="matching-encrypted-group"
                checked={chosenGroup === group.g}
                onChange={() => onChoose(group.g)}
                className="tw-accent-primary-500"
              />
            )}
            <span className="tw-min-w-0 tw-break-words">
              {getConversationTitle(locale, group, selfProfileId)}
              {several && (
                <span className="tw-block tw-text-xs tw-text-iron-400">
                  {formatDate(locale, group.updatedAt)} ·{" "}
                  {formatTime(locale, group.updatedAt)}
                </span>
              )}
            </span>
          </Row>
        );
      })}
    </fieldset>
  );
}
