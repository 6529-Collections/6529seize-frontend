"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import DropsListItemDeleteDropModal from "@/components/drops/view/item/options/delete/DropsListItemDeleteDropModal";
import { useCompetition } from "@/contexts/CompetitionContext";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { invalidateCompetition } from "@/services/api/competitions-api";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { COMPETITION_BUTTON } from "./CompetitionState";

export default function CompetitionEntryDelete({
  entry,
}: {
  readonly entry: ApiCompetitionEntry;
}) {
  const { competition, wave } = useCompetition();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const client = useQueryClient();
  const locale = useBrowserLocale();
  const [confirming, setConfirming] = useState(false);
  const canDelete =
    !!connectedProfile?.handle &&
    !activeProfileProxy &&
    (connectedProfile.id === entry.submitter.id ||
      (competition.permissions.administer &&
        wave.wave.admin_drop_deletion_enabled));

  if (!isMultiCompetitionEnabled() || !canDelete) return null;

  return (
    <>
      <button
        type="button"
        className={COMPETITION_BUTTON}
        onClick={() => setConfirming(true)}
      >
        {t(locale, "competitions.delete")}
      </button>
      {confirming && (
        <DropsListItemDeleteDropModal
          drop={{
            id: entry.drop_id,
            drop_type: ApiDropType.Participatory,
            wave: { id: wave.id },
          }}
          closeModal={() => setConfirming(false)}
          onDropDeleted={() => {
            setConfirming(false);
            void invalidateCompetition(client, {
              waveId: wave.id,
              competitionId: competition.id,
            });
          }}
        />
      )}
    </>
  );
}
