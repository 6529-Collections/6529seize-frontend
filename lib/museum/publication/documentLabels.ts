import type { MessageKey } from "@/i18n/messages";
import type { MuseumPublicDocumentKind } from "./types";

export type MuseumDocumentKindLabelKey = Extract<
  MessageKey,
  `museum.network.research.documentKind.${string}`
>;

export function museumDocumentKindLabelKey(
  kind: MuseumPublicDocumentKind
): MuseumDocumentKindLabelKey {
  switch (kind) {
    case "artist_practice":
      return "museum.network.research.documentKind.artistStudy";
    case "project_essay":
      return "museum.network.research.documentKind.projectStudy";
    case "object_entry":
      return "museum.network.research.documentKind.workEntry";
    case "acquisition_essay":
    case "collection_essay":
    case "gift_narrative":
    case "program_essay":
      return "museum.network.research.documentKind.essay";
    case "technical_condition_review":
    case "title_rights_accession_review":
    case "custody_title_compliance_diligence":
    case "data_architecture_overview":
    case "data_architecture_standard":
    case "data_architecture_case_study":
      return "museum.network.research.documentKind.technicalProvenance";
    case "rights_handbook":
    case "rights_artist_guide":
    case "rights_collector_guide":
      return "museum.network.research.documentKind.institutionalRecord";
    case "institutional_practice_study":
    case "institutional_practice_adjacent":
    case "institution_profile":
      return "museum.network.research.documentKind.museumPractice";
    case "source_record":
    case "source_chronology_matrix":
    case "institutional_practice_source_register":
    case "scholarship_editorial_standard":
      return "museum.network.research.documentKind.sourceRecord";
    case "founding_principles":
    case "open_museum_statement":
    case "onchain_transition":
    case "contributor_guide":
      return "museum.network.research.documentKind.institutionalRecord";
    case "curatorial_accession_review":
    case "accession_certificate":
    case "gift_acceptance_authorization":
      return "museum.network.research.documentKind.technicalProvenance";
  }
}
