export const CASEY_ARTIST_ID = "casey-reas";
export const CASEY_ACCESSION_ID = "6529NM.2026.001";
export const CASEY_OBJECT_IDS = [
  "6529NM.2026.001.01",
  "6529NM.2026.001.02",
  "6529NM.2026.001.03",
  "6529NM.2026.001.04",
  "6529NM.2026.001.05",
  "6529NM.2026.001.06",
  "6529NM.2026.001.07",
] as const;

export const CASEY_OBJECT_PATHS = CASEY_OBJECT_IDS.map(
  (objectId) =>
    `records/accessions/${CASEY_ACCESSION_ID}/objects/${objectId}.json`
);
export const CASEY_VISUAL_OBSERVATION_PATH = `records/accessions/${CASEY_ACCESSION_ID}/visual-observation-record.json`;
export const CASEY_GIFT_AUTHORIZATION_PATH = `records/accessions/${CASEY_ACCESSION_ID}/gift-acceptance-authorization.json`;
export const CASEY_GIFT_NARRATIVE_PATH = `records/accessions/${CASEY_ACCESSION_ID}/public/gift-into-public-trust.md`;
export const CASEY_SOURCE_MATRIX_PATH = `records/accessions/${CASEY_ACCESSION_ID}/public/source-and-chronology-matrix.md`;
