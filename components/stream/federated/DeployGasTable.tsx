import { standardsOf } from "@/components/stream/federated/launchForm";
import GasNote from "@/components/stream/ui/GasNote";
import { STREAM_HELP } from "@/components/stream/ui/styles";
import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import {
  type DeployGas,
  deployGas,
  deployGasEstimate,
  GLAMSTERDAM_PRICES,
} from "@/lib/stream/gas";
import type {
  FederatedForm,
  FederatedTemplate,
  TokenStandard,
} from "@/lib/stream/types";

const CELL =
  "tw-whitespace-nowrap tw-px-3 tw-py-2 tw-text-right first:tw-whitespace-normal first:tw-pl-0 first:tw-text-left last:tw-pr-0";

/** Column heads: the token standards as written, short enough for 375px. */
const STANDARD_NAME: Readonly<Record<TokenStandard, string>> = {
  ERC721: "ERC-721",
  ERC1155: "ERC-1155",
};

function compact(locale: SupportedLocale, gas: number): string {
  return formatNumber(locale, gas, {
    notation: "compact",
    maximumSignificantDigits: 3,
  });
}

interface Column {
  readonly standard: TokenStandard;
  readonly template: FederatedTemplate;
  readonly gas: DeployGas;
}

/**
 * The deploy's gas, per contract, priced the way Sepolia's Glamsterdam prices
 * state: code bytes, new storage slots and the creation itself. Always
 * labelled "Sepolia, estimated".
 */
export default function DeployGasTable({
  form,
  templates,
  locale,
}: {
  readonly form: FederatedForm;
  readonly templates: readonly FederatedTemplate[];
  readonly locale: SupportedLocale;
}) {
  const columns: Column[] = standardsOf(form).flatMap((standard) => {
    const template = templates.find((entry) => entry.standard === standard);
    return template === undefined
      ? []
      : [
          {
            standard,
            template,
            gas: deployGas(template.codeBytes, template.newSlots),
          },
        ];
  });
  const caption = t(locale, "stream.launch.gas.caption");
  const rows = [
    {
      key: "code",
      label: t(locale, "stream.launch.gas.code"),
      value: (column: Column) => column.gas.code,
      detail: (column: Column) =>
        t(locale, "stream.launch.gas.codeValue", {
          bytes: formatInteger(locale, column.template.codeBytes),
        }),
    },
    {
      key: "slots",
      label: t(locale, "stream.launch.gas.slots"),
      value: (column: Column) => column.gas.slots,
      detail: (column: Column) =>
        t(locale, "stream.launch.gas.slotsValue", {
          slots: formatInteger(locale, column.template.newSlots),
        }),
    },
    {
      key: "create",
      label: t(locale, "stream.launch.gas.create"),
      value: (column: Column) => column.gas.create,
      detail: () => null,
    },
  ] as const;
  return (
    <div>
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-border-collapse tw-text-sm tw-tabular-nums">
          <caption className="tw-pb-2 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-text-iron-400">
            {caption}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={`${CELL} tw-font-medium tw-text-iron-400`}
              >
                {t(locale, "stream.launch.gas.item")}
              </th>
              {columns.map((column) => (
                <th
                  key={column.standard}
                  scope="col"
                  className={`${CELL} tw-font-medium tw-text-iron-400`}
                >
                  {STANDARD_NAME[column.standard]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-text-iron-200"
              >
                <th scope="row" className={`${CELL} tw-font-normal`}>
                  {row.label}
                </th>
                {columns.map((column) => (
                  <td key={column.standard} className={CELL}>
                    {compact(locale, row.value(column))}
                    {row.detail(column) === null ? null : (
                      <span className="tw-block tw-text-xs tw-text-iron-400">
                        {row.detail(column)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-font-semibold tw-text-iron-50">
              <th scope="row" className={CELL}>
                {t(locale, "stream.launch.gas.total")}
              </th>
              {columns.map((column) => (
                <td key={column.standard} className={CELL}>
                  {compact(locale, column.gas.total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="tw-mt-2">
        <GasNote
          locale={locale}
          estimate={deployGasEstimate(columns.map((column) => column.gas))}
        />
      </div>
      <p className={`${STREAM_HELP} tw-mt-1`}>
        {t(locale, "stream.launch.gas.pricing", {
          byte: formatInteger(locale, GLAMSTERDAM_PRICES.codeByte),
          slot: compact(locale, GLAMSTERDAM_PRICES.newSlot),
        })}
      </p>
    </div>
  );
}
