import WavesCard from "./WavesCard";

export default function WavesList() {
  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl tw-mx-auto tw-py-12">
        <h1>Waves</h1>
        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <WavesCard />
        </div>
      </div>
    </div>
  );
}
