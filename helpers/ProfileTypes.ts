import { ProfileMin } from "../generated/models/ProfileMin";

export type ProfileMinWithoutSubs = Omit<ProfileMin, 'subscribed_actions'>;