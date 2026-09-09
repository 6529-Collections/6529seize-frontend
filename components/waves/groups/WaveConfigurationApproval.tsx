import WaveApprovalThresholds from "@/components/waves/specs/WaveApprovalThresholds";
import type { ApiWave } from "@/generated/models/ApiWave";
import type {
  WaveRuleRow,
  WaveRuleSection,
} from "@/helpers/waves/wave-rules.shared";
import WavePanelSection from "./WavePanelSection";

interface WaveConfigurationApprovalProps {
  readonly wave: ApiWave;
  readonly section: WaveRuleSection;
}

const READ_ONLY_APPROVAL_ROW_IDS = new Set(["approval-max", "approval-window"]);

function WaveConfigurationApprovalReadOnlyRow({
  row,
}: {
  readonly row: WaveRuleRow;
}) {
  return (
    <div className="tw-grid tw-min-h-9 tw-w-full tw-grid-cols-[minmax(5.5rem,0.7fr)_minmax(0,1.3fr)] tw-items-start tw-gap-x-2 tw-gap-y-1 tw-px-2 tw-py-1.5 tw-text-sm">
      <span className="tw-min-w-0 tw-py-0.5 tw-font-normal tw-leading-5 tw-text-iron-500">
        {row.label}
      </span>
      <span className="tw-min-w-0 tw-break-words tw-py-0.5 tw-text-right tw-font-medium tw-leading-5 tw-text-iron-50">
        {row.value}
      </span>
    </div>
  );
}

export default function WaveConfigurationApproval({
  wave,
  section,
}: WaveConfigurationApprovalProps) {
  const readOnlyRows = section.rows.filter((row) =>
    READ_ONLY_APPROVAL_ROW_IDS.has(row.id)
  );

  return (
    <WavePanelSection title={section.title}>
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5">
        <WaveApprovalThresholds wave={wave} display="configuration" />
        {readOnlyRows.map((row) => (
          <WaveConfigurationApprovalReadOnlyRow key={row.id} row={row} />
        ))}
      </div>
    </WavePanelSection>
  );
}
