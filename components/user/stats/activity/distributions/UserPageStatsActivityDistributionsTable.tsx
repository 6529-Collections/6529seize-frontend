import { IDistribution } from "../../../../../entities/IDistribution";

export default function UserPageStatsActivityDistributionsTable({
  items,
}: {
  readonly items: IDistribution[];
}) {
  return (
    <div>
      {items.map((item) => (
        <div key={`${item.contract}-${item.card_id}-${item.wallet}`}>
          {item.card_id}
        </div>
      ))}
    </div>
  );
}
