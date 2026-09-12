"use client";

import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiModerationCheckDetailActionEffectEnum,
  type ApiModerationCheckDetail,
} from "@/generated/models/ApiModerationCheckDetail";
import { ApiModerationAction } from "@/generated/models/ApiModerationAction";
import type { ApiModerationActionRequest } from "@/generated/models/ApiModerationActionRequest";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { applyModerationAction } from "@/services/api/moderation-checks-api";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  MODERATION_CHECKS_QUERY_KEY,
  MODERATION_QUEUE_QUERY_KEY,
  invalidateContentModerationPresentation,
  clearPrivateModerationQueries,
} from "@/services/content-moderation/content-moderation-query";
import { CONTENT_MODERATOR_ACCESS_QUERY_KEY } from "@/hooks/content-moderation/useContentModeratorAccess";
import { checkButtonClass, checkControlClass } from "./checks.helpers";

function moderationActionLabel(
  locale: SupportedLocale,
  action: ApiModerationAction,
  detail: ApiModerationCheckDetail
): string {
  if (
    detail.action_effect ===
    ApiModerationCheckDetailActionEffectEnum.GlobalCategoryRule
  ) {
    if (action === ApiModerationAction.Allow)
      return t(locale, "checks.allowCategory");
    if (action === ApiModerationAction.Block)
      return t(locale, "checks.blockCategory");
  }
  if (
    action === ApiModerationAction.Allow &&
    detail.action_effect ===
      ApiModerationCheckDetailActionEffectEnum.ExactResubmissionPermit
  )
    return t(locale, "checks.allowResubmission");
  return t(locale, `checks.action.${action}`);
}

export default function CheckActions({
  detail,
  onSaved,
  onReload,
}: {
  readonly detail: ApiModerationCheckDetail;
  readonly onSaved: (detail: ApiModerationCheckDetail) => void;
  readonly onReload: () => void;
}) {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const id = useId();
  const [action, setAction] = useState<ApiModerationAction | "">("");
  const [reason, setReason] = useState("");
  const [request, setRequest] = useState<ApiModerationActionRequest | null>(
    null
  );
  const mutation = useMutation({
    mutationKey: [...MODERATION_CHECKS_QUERY_KEY, "action", detail.check.id],
    mutationFn: (body: ApiModerationActionRequest) =>
      applyModerationAction(detail.check.id, body),
    retry: false,
    gcTime: 0,
  });
  const conflict = getStructuredApiErrorStatus(mutation.error) === 409;
  const locked = mutation.isPending || mutation.isError;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === "" || !reason.trim() || mutation.isPending || conflict)
      return;
    const body = request ?? {
      action,
      reason: reason.trim(),
      expected_version: detail.check.version,
      idempotency_key: globalThis.crypto.randomUUID(),
    };
    setRequest(body);
    mutation.mutate(body, {
      // Per-call callbacks are skipped after unmount, preventing a late response
      // from repopulating private queries after an identity change.
      onSuccess: (updated) => {
        onSaved(updated);
        void queryClient.invalidateQueries({
          queryKey: MODERATION_QUEUE_QUERY_KEY,
        });
        void queryClient.invalidateQueries({
          queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY,
        });
        void invalidateContentModerationPresentation(queryClient);
        setAction("");
        setReason("");
        setRequest(null);
      },
      onError: (error) => {
        const status = getStructuredApiErrorStatus(error);
        if (status !== 401 && status !== 403) return;
        clearPrivateModerationQueries(queryClient);
        queryClient.setQueriesData(
          { queryKey: CONTENT_MODERATOR_ACCESS_QUERY_KEY },
          {
            moderator: false,
            has_open_reports: false,
            open_report_count: 0,
            resolved_report_count: 0,
            suspended_profile_count: 0,
          }
        );
      },
    });
  }
  if (detail.allowed_actions.length === 0)
    return (
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "checks.noActions")}
      </p>
    );
  return (
    <form
      onSubmit={submit}
      className="tw-space-y-4"
      aria-busy={mutation.isPending}
    >
      <p className="tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, `checks.effect.${detail.action_effect}`)}
      </p>
      <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300">
        <span>{t(locale, "checks.chooseAction")}</span>
        <select
          className={checkControlClass}
          value={action}
          required
          disabled={locked}
          onChange={(event) => {
            setAction(event.target.value as ApiModerationAction);
            setRequest(null);
            mutation.reset();
          }}
        >
          <option value="">{t(locale, "checks.chooseAction")}</option>
          {detail.allowed_actions.map((value) => (
            <option key={value} value={value}>
              {moderationActionLabel(locale, value, detail)}
            </option>
          ))}
        </select>
      </label>
      {action === ApiModerationAction.Reevaluate && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "checks.reevaluateHelp")}
        </p>
      )}
      {action !== "" && (
        <>
          <label className="tw-block tw-space-y-2 tw-text-sm tw-text-iron-300">
            <span>{t(locale, "checks.reason")}</span>
            <textarea
              className={checkControlClass}
              rows={3}
              required
              minLength={1}
              maxLength={2000}
              value={reason}
              disabled={locked}
              aria-describedby={`${id}-reason-help`}
              onChange={(event) => {
                setReason(event.target.value);
                setRequest(null);
              }}
            />
          </label>
          <p id={`${id}-reason-help`} className="tw-text-xs tw-text-iron-400">
            {t(locale, "checks.reasonHelp")}
          </p>
          <button
            type="submit"
            className={checkButtonClass}
            disabled={!reason.trim() || mutation.isPending || conflict}
          >
            {t(
              locale,
              mutation.isPending ? "checks.applying" : "checks.confirm",
              { action: moderationActionLabel(locale, action, detail) }
            )}
          </button>
        </>
      )}
      {mutation.isError && (
        <div role="alert" className="tw-space-y-3 tw-text-sm tw-text-iron-200">
          <p>
            {t(locale, conflict ? "checks.conflict" : "checks.actionError")}
          </p>
          {conflict && (
            <button
              type="button"
              className={checkButtonClass}
              onClick={onReload}
            >
              {t(locale, "checks.loadLatest")}
            </button>
          )}
          {
            <button
              type="button"
              className={checkButtonClass}
              onClick={() => {
                setAction("");
                setReason("");
                setRequest(null);
                mutation.reset();
                onReload();
              }}
            >
              {t(locale, "checks.cancel")}
            </button>
          }
        </div>
      )}
      {mutation.isSuccess && (
        <output className="tw-block tw-text-sm tw-text-iron-200">
          {t(locale, "checks.success")}
        </output>
      )}
    </form>
  );
}
