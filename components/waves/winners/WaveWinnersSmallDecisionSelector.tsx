import React from "react";
import { format } from "date-fns";

interface DecisionPoint {
  id: string;
  date: string;
  winnersCount?: number; // Optional count of winners
}

interface WaveWinnersSmallDecisionSelectorProps {
  readonly decisionPoints: DecisionPoint[];
  readonly activeDecisionPoint: string | null;
  readonly onChange: (decisionPointId: string) => void;
}

export const WaveWinnersSmallDecisionSelector: React.FC<WaveWinnersSmallDecisionSelectorProps> = ({
  decisionPoints,
  activeDecisionPoint,
  onChange,
}) => {
  return (
    <div className="tw-mt-3 tw-mb-4">
      <select 
        className="tw-w-full tw-px-3 tw-py-2 tw-rounded-lg tw-bg-iron-800 tw-border tw-border-iron-700 tw-text-sm tw-text-iron-100"
        value={activeDecisionPoint || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {decisionPoints.map((point, index) => (
          <option key={point.id} value={point.id}>
            {format(new Date(point.date), "MMM d, yyyy h:mm a")}
            {point.winnersCount !== undefined && ` (${point.winnersCount} winner${point.winnersCount !== 1 ? 's' : ''})`}
          </option>
        ))}
      </select>
    </div>
  );
};