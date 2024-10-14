import { ApiProfileMin } from "../generated/models/ApiProfileMin";

export type ProfileMinWithoutSubs = Omit<
  ApiProfileMin,
  "subscribed_actions"
>;
