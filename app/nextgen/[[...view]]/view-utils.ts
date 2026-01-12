import { NextgenView } from "@/types/enums";

export function getNextGenView(view: string): NextgenView | undefined {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(NextgenView).find(
    ([, value]) => value.toLowerCase() === normalizedView
  );
  return entry ? NextgenView[entry[0] as keyof typeof NextgenView] : undefined;
}
