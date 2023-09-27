export default function MapDelegationsDone({ contract }: { contract: string }) {
  return (
    <p className="tw-mb-0 tw-text-base tw-font-normal tw-text-white">
      Delegations are done using contract <span className="tw-font-bold">{contract}</span>
    </p>
  );
}
