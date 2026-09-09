import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { displayMuseumStatus } from "@/lib/museum/presentation";

export function displayGovernanceDecisionClass(value: string): string {
  switch (value) {
    case "collection_preapproval":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.decisionClass.collectionPreapproval"
      );
    case "collecting_scope":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.decisionClass.collectingScope"
      );
    case "donation_policy":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.decisionClass.donationPolicy"
      );
    default:
      return displayMuseumStatus(value);
  }
}

export function displayGovernanceWaveStatus(value: string): string {
  switch (value) {
    case "WINNER":
      return t(DEFAULT_LOCALE, "museum.network.governance.waveStatus.winner");
    case "PARTICIPATORY":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.waveStatus.participatory"
      );
    default:
      return displayMuseumStatus(value);
  }
}

export function displayGovernanceEffect(value: string): string {
  switch (value) {
    case "adopted":
      return t(DEFAULT_LOCALE, "museum.network.governance.effect.adopted");
    case "no_adopted_effect_at_snapshot":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.effect.noAdoptedEffectAtSnapshot"
      );
    default:
      return displayMuseumStatus(value);
  }
}

export function displayGovernanceDisposition(value: string): string {
  switch (value) {
    case "deferred":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.disposition.deferred"
      );
    case "undetermined":
      return t(
        DEFAULT_LOCALE,
        "museum.network.governance.disposition.undetermined"
      );
    default:
      return displayMuseumStatus(value);
  }
}
