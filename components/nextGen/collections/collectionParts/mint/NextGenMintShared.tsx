import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { useEnsName } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

export const MINT_INPUT_CLASSNAME =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-[color-scheme:dark] placeholder:tw-text-iron-500 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-black/10 disabled:tw-text-iron-500";

export const MINT_SELECT_CLASSNAME =
  "tw-min-h-11 tw-w-full tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/20 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-[color-scheme:dark] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-black/10 disabled:tw-text-iron-500";

export const MINT_ACTION_BUTTON_CLASSNAME =
  "tw-inline-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#208359] tw-px-5 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-transition hover:tw-bg-[#2aac75] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500";

export function MintInfoTooltip(
  props: Readonly<{ id: string; label: string; content: string }>
) {
  return (
    <>
      <button
        type="button"
        aria-label={props.label}
        data-tooltip-id={props.id}
        className="tw-inline-flex tw-h-8 tw-w-8 tw-cursor-help tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        <FontAwesomeIcon
          className="tw-h-4 tw-w-4"
          icon={faInfoCircle}
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={props.id}
        content={props.content}
        place="top"
        className="!tw-bg-iron-800 !tw-px-2 !tw-py-1 !tw-text-white"
      />
    </>
  );
}

function NextGenMintAddressOption(props: Readonly<{ address: string }>) {
  const ens = useEnsName({
    address: props.address as `0x${string}`,
    chainId: 1,
  });

  return (
    <option value={props.address}>
      {ens.data ? `${ens.data} - ${props.address}` : props.address}
    </option>
  );
}

export function NextGenMintingFor(
  props: Readonly<{
    title: string;
    delegators: string[];
    mintForAddress: string | undefined;
    setMintForAddress: (address: string) => void;
  }>
) {
  const account = useSeizeConnectContext();
  const fieldId = `mint-for-${props.title.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="tw-grid tw-gap-2">
      <div className="tw-flex tw-items-center">
        <label
          htmlFor={fieldId}
          className="tw-text-sm tw-font-medium tw-text-iron-300"
        >
          {props.title}
        </label>
        <MintInfoTooltip
          id="mint-for-address-info"
          label={`${props.title} help`}
          content="The address you are minting for"
        />
      </div>
      <select
        id={fieldId}
        className={MINT_SELECT_CLASSNAME}
        value={props.mintForAddress}
        onChange={(e) => {
          props.setMintForAddress(e.currentTarget.value);
        }}
      >
        <option value="" disabled>
          Select Address to {props.title}
        </option>
        {account.address && (
          <NextGenMintAddressOption address={account.address} />
        )}
        {props.delegators.map((delegator) => (
          <NextGenMintAddressOption
            address={delegator}
            key={`delegator-${delegator}`}
          />
        ))}
      </select>
    </div>
  );
}

export function NextGenMintErrors({
  errors,
  className = "tw-py-2",
}: Readonly<{
  errors: string[];
  className?: string;
}>) {
  return (
    <div
      role="alert"
      className={`${className} tw-rounded-lg tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-px-3 tw-text-sm`}
    >
      <p className="tw-mb-1 tw-font-semibold tw-text-white">Unable to mint</p>
      <div className="tw-flex tw-items-center">
        <ul className="tw-mb-0 tw-pl-5 tw-text-iron-200">
          {errors.map((error) => (
            <li key={`mint-error-${error.replaceAll(" ", "-")}`}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
