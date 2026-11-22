import { getAddress } from "viem";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type {
  DecodedTuple,
  DecodedValue,
} from "@/lib/desktop/wallet-transactions/decode";
import type { RuleArg } from "@/lib/desktop/wallet-transactions/types";

type Locale = ReturnType<typeof useBrowserLocale>;

/**
 * A decoded call argument as text for the browser page: addresses
 * checksummed, numbers with locale grouping, strings quoted, allowlist
 * proofs counted, tuples field by field (`components` gives their names
 * and types).
 */
export function formatDecodedValue(
  locale: Locale,
  type: string,
  value: DecodedValue,
  components?: readonly RuleArg[]
): string {
  if (type === "bytes32[]" && Array.isArray(value)) {
    return t(locale, "browserConnector.tx.proof", {
      count: formatDecimalString(locale, String(value.length)),
    });
  }
  if (type === "bytes32[][]" && Array.isArray(value)) {
    return t(locale, "browserConnector.tx.proofs", {
      count: formatDecimalString(locale, String(value.length)),
    });
  }
  if (Array.isArray(value)) {
    const elementType = type.slice(0, -2);
    const separator = components === undefined ? ", " : "; ";
    return (value as readonly DecodedValue[])
      .map((element) => formatDecodedValue(locale, elementType, element, components))
      .join(separator);
  }
  if (components !== undefined) {
    // A tuple: each field by name, with its own type.
    const tuple = value as DecodedTuple;
    const fields = components.map((component) =>
      t(locale, "browserConnector.tx.field", {
        name: component.name,
        value: formatValue(
          locale,
          component.type,
          tuple[component.name] ?? "",
          component.components
        ),
      })
    );
    return `(${fields.join(", ")})`;
  }
  if (typeof value === "boolean") {
    return t(
      locale,
      value ? "browserConnector.tx.yes" : "browserConnector.tx.no"
    );
  }
  if (typeof value === "bigint") {
    return formatDecimalString(locale, value.toString());
  }
  const text = value as string;
  if (type === "address") return getAddress(text);
  if (type === "string") {
    return t(locale, "browserConnector.tx.quoted", { text });
  }
  return text;
}
