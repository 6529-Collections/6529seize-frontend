export default function PrimaryButton({children, onClick}: {readonly children: React.ReactNode, onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      {children}
    </button>
  );
}
