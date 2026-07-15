import type { MessageKey } from "@/i18n/messages/en-US";

const DROP_REACTION_MESSAGE_KEYS = [
  "drops.reactions.capabilityDisabled",
  "drops.reactions.requestTimedOut",
  "drops.reactions.rateLimit.retryAfter.moment",
  "drops.reactions.rateLimit.retryAfter.seconds.one",
  "drops.reactions.rateLimit.retryAfter.seconds.other",
  "drops.reactions.rateLimit.retryAfter.minutes.one",
  "drops.reactions.rateLimit.retryAfter.minutes.other",
] as const satisfies readonly MessageKey[];

type DropReactionMessageKey = (typeof DROP_REACTION_MESSAGE_KEYS)[number];
type DropReactionMessageValues = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const buildDropReactionMessages = (
  values: DropReactionMessageValues
): Record<DropReactionMessageKey, string> =>
  Object.fromEntries(
    DROP_REACTION_MESSAGE_KEYS.map((key, index) => [key, values[index]])
  ) as Record<DropReactionMessageKey, string>;

export const FR_FR_DROP_REACTION_MESSAGES = buildDropReactionMessages([
  "Les réactions sont désactivées pour cette wave.",
  "La demande de réaction a expiré. Actualisation du dernier état des réactions ; attendez avant de réessayer.",
  "Vous réagissez trop vite. Réessayez dans un instant.",
  "Vous réagissez trop vite. Réessayez dans {count} seconde.",
  "Vous réagissez trop vite. Réessayez dans {count} secondes.",
  "Vous réagissez trop vite. Réessayez dans {count} minute.",
  "Vous réagissez trop vite. Réessayez dans {count} minutes.",
]);

export const ES_ES_DROP_REACTION_MESSAGES = buildDropReactionMessages([
  "Las reacciones están desactivadas en esta wave.",
  "La solicitud de reacción agotó el tiempo de espera. Actualizando el estado más reciente; espera antes de volver a intentarlo.",
  "Estás reaccionando demasiado rápido. Inténtalo de nuevo en un momento.",
  "Estás reaccionando demasiado rápido. Inténtalo de nuevo en {count} segundo.",
  "Estás reaccionando demasiado rápido. Inténtalo de nuevo en {count} segundos.",
  "Estás reaccionando demasiado rápido. Inténtalo de nuevo en {count} minuto.",
  "Estás reaccionando demasiado rápido. Inténtalo de nuevo en {count} minutos.",
]);

export const DE_DE_DROP_REACTION_MESSAGES = buildDropReactionMessages([
  "Reaktionen sind für diese Wave deaktiviert.",
  "Zeitüberschreitung bei der Reaktionsanfrage. Der aktuelle Reaktionsstatus wird aktualisiert; bitte warte, bevor du es erneut versuchst.",
  "Du reagierst zu schnell. Versuche es gleich erneut.",
  "Du reagierst zu schnell. Versuche es in {count} Sekunde erneut.",
  "Du reagierst zu schnell. Versuche es in {count} Sekunden erneut.",
  "Du reagierst zu schnell. Versuche es in {count} Minute erneut.",
  "Du reagierst zu schnell. Versuche es in {count} Minuten erneut.",
]);
