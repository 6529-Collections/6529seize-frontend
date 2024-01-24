import { CollectedCard } from "../../../../entities/IProfile";

export default function UserPageCollectedCards({
  cards,
}: {
  readonly cards: CollectedCard[];
}) {
  return (
    <div>
      {cards.map((card) => {
        return (
          <div key={card.token_id}>
            {card.collection} - {card.token_id} - {card.token_name} - {card.tdh}{" "}
            - {card.rank} {card.seized_count} - {card.szn}
          </div>
        );
      })}
    </div>
  );
}
