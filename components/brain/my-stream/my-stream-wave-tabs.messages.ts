import type { SupportedLocale } from "@/i18n/locales";

type ScrollDirection = "left" | "right";

const SCROLL_LABELS: Record<
  SupportedLocale,
  Record<ScrollDirection, string>
> = {
  "en-US": {
    left: "Scroll wave sections left",
    right: "Scroll wave sections right",
  },
  "en-GB": {
    left: "Scroll wave sections left",
    right: "Scroll wave sections right",
  },
  "fr-FR": {
    left: "Faire défiler les sections de la wave vers la gauche",
    right: "Faire défiler les sections de la wave vers la droite",
  },
  "es-ES": {
    left: "Desplazar las secciones de la wave hacia la izquierda",
    right: "Desplazar las secciones de la wave hacia la derecha",
  },
  "de-DE": {
    left: "Wave-Bereiche nach links scrollen",
    right: "Wave-Bereiche nach rechts scrollen",
  },
};

export const getWaveTabsScrollLabel = (
  locale: SupportedLocale,
  direction: ScrollDirection
): string => SCROLL_LABELS[locale][direction];
