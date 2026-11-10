/**
 * Colours from profiles, the API or site content that are placed in an inline
 * `style`. Only a plain colour value is accepted, so a stored value can never
 * add a declaration, an image request or a variable reference to the style.
 */

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_FUNCTION = /^(rgba?|hsla?)\(([^()]*)\)$/i;
const NUMBER = /^[+-]?\d*\.?\d+%?$/;
const HUE = /^[+-]?\d*\.?\d+(?:deg|grad|rad|turn)?$/i;
const MAX_COLOR_LENGTH = 64;

/** The arguments of `rgb(1, 2, 3, 0.5)` or `rgb(1 2 3 / 50%)`, if well formed. */
function getColorArguments(body: string): string[] | null {
  const trimmed = body.trim();
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((part) => part.trim());
    return parts.length === 3 || parts.length === 4 ? parts : null;
  }
  const [channels = "", alpha, ...rest] = trimmed.split("/");
  if (rest.length > 0) {
    return null;
  }
  const parts = channels.trim().split(/\s+/);
  if (parts.length !== 3) {
    return null;
  }
  return alpha === undefined ? parts : [...parts, alpha.trim()];
}

function isColorFunction(value: string): boolean {
  const match = COLOR_FUNCTION.exec(value);
  const name = match?.[1]?.toLowerCase();
  const args = match?.[2] === undefined ? null : getColorArguments(match[2]);
  if (!name || !args) {
    return false;
  }
  return args.every((arg, index) =>
    index === 0 && name.startsWith("hsl") ? HUE.test(arg) : NUMBER.test(arg)
  );
}

/**
 * `value` trimmed when it is a hex (3, 4, 6 or 8 digits), `rgb()`, `rgba()`,
 * `hsl()` or `hsla()` colour with numeric arguments; otherwise null, so the
 * caller uses its default colour.
 */
export function getSafeCssColor(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.length > MAX_COLOR_LENGTH) {
    return null;
  }
  return HEX_COLOR.test(trimmed) || isColorFunction(trimmed) ? trimmed : null;
}
