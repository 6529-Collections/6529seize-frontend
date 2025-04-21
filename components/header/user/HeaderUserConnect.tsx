import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export default function HeaderUserConnect(props: Readonly<{}>) {
  const { seizeConnect } = useSeizeConnectContext();

  return (
    <button
      onClick={() => seizeConnect()}
      type="button"
      className="tw:whitespace-nowrap tw:inline-flex tw:items-center tw:cursor-pointer tw:bg-primary-500 tw:px-4 tw:py-2.5 tw:text-sm tw:leading-6 tw:rounded-lg tw:font-semibold tw:text-white tw:border-0 tw:ring-1 tw:ring-inset tw:ring-primary-500 tw:hover:ring-primary-600 tw:placeholder:text-iron-300 tw:focus:outline-none tw:focus:ring-1 tw:focus:ring-inset tw:shadow-sm tw:hover:bg-primary-600 tw:transition tw:duration-300 tw:ease-out">
      Connect
    </button>
  );
}
