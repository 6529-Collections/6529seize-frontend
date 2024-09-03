import Link from "next/link";
import { Wave } from "../../../../../generated/models/Wave";

export default function WaveHeaderName({ wave }: { readonly wave: Wave }) {
  return (
    <Link href={`/waves/${wave.id}`} className="tw-no-underline">
      <h1 className="tw-truncate tw-text-xl sm:tw-text-2xl tw-font-semibold  tw-text-white hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
        {wave.name}
      </h1>
    </Link>
  );
}
