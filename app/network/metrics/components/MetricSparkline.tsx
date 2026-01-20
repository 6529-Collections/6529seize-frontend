interface MetricSparklineProps {
  readonly data: number[];
  readonly color: string;
}

export default function MetricSparkline({ data, color }: MetricSparklineProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data);
  const reversed = [...data].reverse();

  return (
    <div className="tw-mt-auto tw-flex tw-h-8 tw-items-end tw-gap-px tw-pt-4">
      {reversed.map((value, index) => {
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div
            key={index}
            className={`tw-flex-1 tw-rounded-t tw-transition-opacity hover:tw-opacity-80 ${color}`}
            style={{ height: `${Math.max(height, 3)}%` }}
          />
        );
      })}
    </div>
  );
}
