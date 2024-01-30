import UserPageErrorWrapper from "../../utils/UserPageErrorWrapper";

export default function UserPageRepNewRepError({
  msg,
  closeError,
}: {
  readonly msg: string;
  readonly closeError: () => void;
}) {
  return (
    <UserPageErrorWrapper closeError={closeError}>
      <div className="tw-flex">
        <div className="tw-ml-3 tw-self-center tw-flex tw-flex-col lg:tw-max-w-xl">
          <h3 className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-red">
            {msg}
          </h3>
          <div>
            <p className="tw-text-justify tw-mt-2 tw-mb-0 tw-text-sm tw-text-iron-300 tw-font-normal">
              Rep is not meant for insults or doxxing so we run proposed rep
              categories through an AI filter. If you think the filter got your
              proposed category wrong, hop into Discord and let us know. In the
              meantime, perhaps you can rephrase that you are trying to say.
            </p>
          </div>
        </div>
      </div>
    </UserPageErrorWrapper>
  );
}
