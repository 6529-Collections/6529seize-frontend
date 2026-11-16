"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import {
  type ApiMainStageTraitIssue,
  ApiMainStageTraitIssueCodeEnum as IssueCode,
} from "@/generated/models/ApiMainStageTraitIssue";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import {
  invalidateCompetition,
  validateMainStageTraits,
} from "@/services/api/competitions-api";
import type { TraitsData } from "../types/TraitsData";
import { buildSubmissionMetadata } from "../utils/submissionMetadata";

export function useMainStageArtworkValidation(
  competition: ApiCompetition | null | undefined,
  traits: TraitsData
) {
  const rules = competition?.main_stage_trait_rules;
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{
    traits: TraitsData;
    issues: ApiMainStageTraitIssue[];
  }>();
  const [pending, setPending] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), [traits, rules]);

  const errors: Partial<Record<keyof TraitsData, string | null>> = {};
  for (const issue of result?.issues ?? []) {
    if (!Object.hasOwn(traits, issue.key)) continue;
    const key = issue.key as keyof TraitsData;
    if (traits[key] !== result?.traits[key]) continue;
    const rule = rules?.find((field) => field.key === key);
    switch (issue.code) {
      case IssueCode.Required:
        errors[key] = t(locale, "memes.submission.traits.required");
        break;
      case IssueCode.Duplicate:
        errors[key] = t(locale, "memes.submission.traits.duplicate");
        break;
      case IssueCode.InvalidChoice:
        errors[key] = t(locale, "memes.submission.traits.invalidChoice");
        break;
      case IssueCode.InvalidPoints:
        errors[key] = t(locale, "memes.submission.traits.invalidPoints", {
          min: formatInteger(locale, rule?.minimum),
          max: formatInteger(locale, rule?.maximum),
        });
        break;
      case IssueCode.InvalidBoolean:
        errors[key] = t(locale, "memes.submission.traits.invalidBoolean");
        break;
    }
  }

  async function validate() {
    if (!competition || request.current) return null;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setRequestFailed(false);
    const identity = {
      waveId: competition.wave_id,
      competitionId: competition.id,
    };
    try {
      const response = await validateMainStageTraits(
        identity,
        { metadata: buildSubmissionMetadata({ traits }) },
        controller.signal
      );
      if (request.current !== controller || controller.signal.aborted)
        return null;
      setResult({ traits, issues: response.issues });
      return response.issues;
    } catch (error) {
      if (request.current === controller && !controller.signal.aborted) {
        setRequestFailed(true);
        // An open draft may still advertise the policy after an API rollback.
        if (getStructuredApiErrorStatus(error) === 404) {
          void invalidateCompetition(queryClient, identity);
        }
      }
      return null;
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
  }

  return { rules, errors, pending, requestFailed, validate };
}
