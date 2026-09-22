const DROP_REQUIREMENT_MESSAGE_KEYS = [
  "waves.requirements.missingSummary",
  "waves.requirements.addImage",
  "waves.requirements.addAudio",
  "waves.requirements.addVideo",
  "waves.requirements.completeMetadataDetails",
] as const;

type DropRequirementMessageKey = (typeof DROP_REQUIREMENT_MESSAGE_KEYS)[number];
type DropRequirementMessageValues = readonly [
  string,
  string,
  string,
  string,
  string,
];

const buildDropRequirementMessages = (
  values: DropRequirementMessageValues
): Record<DropRequirementMessageKey, string> =>
  Object.fromEntries(
    DROP_REQUIREMENT_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<DropRequirementMessageKey, string>;

export const EN_DROP_REQUIREMENT_MESSAGES = buildDropRequirementMessages([
  "Required: {requirements}.",
  "add an image",
  "add audio",
  "add a video",
  "complete metadata ({items})",
]);

export const FR_FR_DROP_REQUIREMENT_MESSAGES = buildDropRequirementMessages([
  "Requis : {requirements}.",
  "ajouter une image",
  "ajouter un fichier audio",
  "ajouter une vidéo",
  "renseigner les métadonnées ({items})",
]);

export const ES_ES_DROP_REQUIREMENT_MESSAGES = buildDropRequirementMessages([
  "Obligatorio: {requirements}.",
  "añadir una imagen",
  "añadir audio",
  "añadir un vídeo",
  "completar los metadatos ({items})",
]);

export const DE_DE_DROP_REQUIREMENT_MESSAGES = buildDropRequirementMessages([
  "Erforderlich: {requirements}.",
  "ein Bild hinzufügen",
  "Audio hinzufügen",
  "ein Video hinzufügen",
  "Metadaten vervollständigen ({items})",
]);
