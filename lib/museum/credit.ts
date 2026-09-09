function trimTrailingCharacters(
  value: string,
  shouldTrim: (character: string) => boolean
): string {
  let end = value.length;
  while (end > 0 && shouldTrim(value[end - 1] ?? "")) {
    end -= 1;
  }
  return value.slice(0, end);
}

function trimTerminalPeriodsAndWhitespace(value: string): string {
  return trimTrailingCharacters(
    value,
    (character) => character === "." || character.trim().length === 0
  );
}

/**
 * Keep the linked license as the single visible rights statement when a
 * source credit line already repeats it at the end.
 */
export function displayCreditWithoutRepeatedLicense(
  creditLine: string,
  licenseLabel: string | null
): string {
  const trimmedCreditLine = creditLine.trim();
  const trimmedLicenseLabel = licenseLabel?.trim() ?? "";
  if (trimmedCreditLine.length === 0 || trimmedLicenseLabel.length === 0) {
    return trimmedCreditLine;
  }

  const creditWithoutTerminalPunctuation =
    trimTerminalPeriodsAndWhitespace(trimmedCreditLine);
  const labelWithoutTerminalPunctuation =
    trimTerminalPeriodsAndWhitespace(trimmedLicenseLabel);
  const unprefixedLabel = labelWithoutTerminalPunctuation.replace(
    /^licensed\s+/iu,
    ""
  );
  const candidates = [
    `Licensed under ${unprefixedLabel}`,
    `Licensed ${unprefixedLabel}`,
    unprefixedLabel,
    labelWithoutTerminalPunctuation,
  ]
    .filter((candidate) => candidate.length > 0)
    .sort((left, right) => right.length - left.length);
  const creditLower = creditWithoutTerminalPunctuation.toLocaleLowerCase();
  const duplicate = candidates.find((candidate) =>
    creditLower.endsWith(candidate.toLocaleLowerCase())
  );
  if (duplicate === undefined) {
    return trimmedCreditLine;
  }

  return trimTrailingCharacters(
    creditWithoutTerminalPunctuation.slice(0, -duplicate.length).trim(),
    (character) => character === ";" || character === ","
  );
}
