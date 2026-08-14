export default function DistributionPlanToolNotConnected() {
  return (
    <div className="tw-flex tw-flex-col">
      <h1 className="tw-text-white">EMMA</h1>
      <h2 className="tw-text-white">Connect Your Wallet</h2>
      <div className="tw-mb-6 lg:tw-max-w-2xl">
        <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-iron-300">
          Connect with an address from within your consolidated account to
          proceed, so that we can verify your TDH to grant you access. No
          special delegation is required. Please don&apos;t connect your vault.
        </p>
        <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-iron-300">
          No gas is needed to sign in, and there is no cost or fee to use the
          tool.
        </p>
      </div>
    </div>
  );
}
