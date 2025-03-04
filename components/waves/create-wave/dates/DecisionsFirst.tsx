import { useCallback, useState } from "react";
import { CreateWaveDatesConfig } from "../../../../types/waves.types";
import CommonCalendar from "../../../utils/calendar/CommonCalendar";
import TimePicker from "../../../common/TimePicker";



interface DecisionsFirstProps {
  readonly firstDecisionTime: number;
  readonly setFirstDecisionTime: (time: number) => void;
}

export default function DecisionsFirst({
  firstDecisionTime,
  setFirstDecisionTime,
}: DecisionsFirstProps) {
  const initialDate = new Date(firstDecisionTime);
  initialDate.setHours(23, 59, 0, 0);

  const [selectedTimestamp, setSelectedTimestamp] = useState(initialDate.getTime());

  const getHours = useCallback(() => {
    return new Date(selectedTimestamp).getHours();
  }, [selectedTimestamp]);

  const getMinutes = useCallback(() => {
    return new Date(selectedTimestamp).getMinutes();
  }, [selectedTimestamp]);

  const onTimeChange = useCallback((hours: number, minutes: number) => {
    setSelectedTimestamp(new Date(selectedTimestamp).setHours(hours, minutes, 0, 0));
  }, [selectedTimestamp]);

  return (
    <>
      <div className="tw-col-span-1">
        <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
          Set end date
        </p>
        <CommonCalendar
          initialMonth={initialDate.getMonth()}
          initialYear={initialDate.getFullYear()}
          selectedTimestamp={selectedTimestamp}
          minTimestamp={initialDate.getTime()}
          maxTimestamp={null}
          setSelectedTimestamp={setSelectedTimestamp}
        />
      </div>
      <div className="tw-col-span-1">
        <p className="tw-mb-3 tw-text-base tw-font-medium tw-text-iron-50">
          Set end time
        </p>
        <TimePicker
          hours={getHours()}
          minutes={getMinutes()}
          onTimeChange={onTimeChange}
        />
      </div>
    </>
  );
}
