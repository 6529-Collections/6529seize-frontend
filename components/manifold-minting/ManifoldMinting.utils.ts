import { Time } from "@/helpers/time";

export function getDateTimeString(time: Time, local_timezone: boolean) {
  if (local_timezone) {
    return time.toLocaleDateTimeString();
  }

  const d = time.toIsoDateString();
  const t = time.toIsoTimeString().split(" ")[0];

  return `${d} ${t?.slice(0, 5)}`;
}
