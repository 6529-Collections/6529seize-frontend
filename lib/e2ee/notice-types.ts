/** Timeline notice codes (contract 8.6 and 12); re-exported by `types.ts`. */
export type E2eeNoticeType =
  | "created"
  | "joined"
  | "left"
  | "removed"
  | "device_added"
  | "device_removed"
  | "renamed"
  | "admins_changed"
  | "safety_code_changed";
