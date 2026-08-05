import { NextgenView } from "@/types/enums";

export function getNextGenView(view: string): NextgenView | undefined {
  const normalizedView = view.trim().toLowerCase();
  return Object.values(NextgenView).find(
    (value) => value.toLowerCase() === normalizedView
  );
}
