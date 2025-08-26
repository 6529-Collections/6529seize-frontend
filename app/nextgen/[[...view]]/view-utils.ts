import { NextGenView } from "@/components/nextGen/collections/NextGenNavigationHeader";

export function getNextGenView(view: string): NextGenView | null {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(NextGenView).find(
    ([, value]) => value.toLowerCase() === normalizedView
  );
  return entry ? NextGenView[entry[0] as keyof typeof NextGenView] : null;
}
