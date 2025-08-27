import { NextGenView } from "@/enums";

export function getNextGenView(view: string): NextGenView | undefined {
  const normalizedView = view.toLowerCase();
  const entry = Object.entries(NextGenView).find(
    ([, value]) => value.toLowerCase() === normalizedView
  );
  return entry ? NextGenView[entry[0] as keyof typeof NextGenView] : undefined;
}
