import PrimaryButton from "../../../common/button/PrimaryButton";
import CommonInput from "../../../common/input/CommonInput";
import CommonInputLabel from "../../../common/input/CommonInputLabel";

export default function RepGiveModal({
  giverAddress,
  receiverAddress,
}: {
  giverAddress: string;
  receiverAddress: string;
}) {
  return (
    <div className="tw-rounded-lg tw-overflow-hidden">
      <div className="tw-p-6 tw-max-h-[calc(100vh_+_-100px)] tw-overflow-y-auto">
        <div>
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-neutral-100">
            Give Reputation
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-neutral-400">
            Use this form to give reputation to another Ethereum address.
          </p>
        </div>
        <form className="tw-mt-8">
          <div>
            <CommonInputLabel>Giver Address</CommonInputLabel>
            <div className="tw-mt-2">
              <CommonInput
                name="giverAddress"
                required={true}
                disabled={true}
                value={giverAddress}
                placeholder="The Ethereum address of the giver."
              />
            </div>
          </div>
          <div className="tw-mt-4">
            <CommonInputLabel>Receiver Address</CommonInputLabel>
            <div className="tw-mt-2">
              <CommonInput
                name="receiverAddress"
                required={true}
                disabled={true}
                value={receiverAddress}
                placeholder="The Ethereum address of the receiver."
              />
            </div>
          </div>
          <div className="tw-mt-4">tag</div>
          <div className="tw-mt-4">
            <CommonInputLabel>Rep to Give</CommonInputLabel>
            <div className="tw-mt-2">
              <CommonInput
                type="number"
                name="repScoreToGive"
                required={true}
                placeholder="Enter the number of reputation points you want to give."
                value={undefined}
              />
            </div>
          </div>
          <div className="tw-mt-8 tw-flex tw-justify-end">
            <PrimaryButton disabled={false} loading={false} buttonType="submit">
              Give Rep Points
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
