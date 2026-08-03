const CASEY_ACCESSION_ID = "6529NM.2026.001";

export interface ProjectDocumentContract {
  readonly id: string;
  readonly path: string;
  readonly projectName:
    | "923 EMPTY ROOMS"
    | "CENTURY"
    | "Ex Nihilo (Cosmos)"
    | "Phototaxis"
    | "Pre-Process";
}

export const PROJECT_PUBLIC_DOCUMENTS: readonly ProjectDocumentContract[] = [
  {
    id: "casey-reas-century-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/projects/century.md`,
    projectName: "CENTURY",
  },
  {
    id: "casey-reas-pre-process-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/projects/process-and-pre-process.md`,
    projectName: "Pre-Process",
  },
  {
    id: "casey-reas-phototaxis-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/projects/microimage-and-phototaxis.md`,
    projectName: "Phototaxis",
  },
  {
    id: "casey-reas-923-empty-rooms-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/projects/atomism-and-923-empty-rooms.md`,
    projectName: "923 EMPTY ROOMS",
  },
  {
    id: "casey-reas-ex-nihilo-cosmos-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/projects/still-life-and-ex-nihilo.md`,
    projectName: "Ex Nihilo (Cosmos)",
  },
];
