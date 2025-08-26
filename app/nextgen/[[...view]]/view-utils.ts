import { NextGenView } from "@/enums";

export function getNextGenView(view: string): NextGenView | null {
  const normalizedView = view.toLowerCase();
  const entries = Object.entries(NextGenView).find(
    ([, value]) => value.toLowerCase() === normalizedView
  );

  return entries ? NextGenView[entries[0] as keyof typeof NextGenView] : null;
}
