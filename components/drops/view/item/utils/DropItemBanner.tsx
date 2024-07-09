import { Drop } from "../../../../../generated/models/Drop";
import { getRandomColorWithSeed } from "../../../../../helpers/Helpers";

export default function DropItemBanner({ drop }: { readonly drop: Drop }) {
  const banner1 =
    drop.author.banner1_color ?? getRandomColorWithSeed(drop.author.handle);
  const banner2 =
    drop.author.banner2_color ?? getRandomColorWithSeed(drop.author.handle);
  return (
    <div
      className="tw-relative tw-w-full tw-h-7 tw-rounded-t-xl"
      style={{
        background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
      }}
    ></div>
  );
}
