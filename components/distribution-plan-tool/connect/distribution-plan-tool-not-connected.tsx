export default function DistributionPlanToolNotConnected() {
  return (
    <div className="tw-flex tw-flex-col">
      <h1 className="tw-uppercase tw-text-white">Not connected</h1>
      <div className="tw-mb-6 lg:tw-max-w-2xl">
        <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-neutral-300">
          You can sign in to use tool with your Seize (eth) account using
          Metamask or any other wallet.
        </p>
        <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-neutral-300">
          There is no cost or gas to sign in.
        </p>
        <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-neutral-300">
          You can use your any address in your consolidated account - we
          recommeng connecting to Seize with the hot address in your
          consolidated account.
        </p>
      </div>
      <p className="tw-mb-0 tw-text-sm tw-uppercase tw-tracking-wide tw-font-bold tw-text-white">
        To continue with the distribution plan tool, please connect your wallet.
      </p>
    </div>
  );
}
