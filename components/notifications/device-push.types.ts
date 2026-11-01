// "e2ee" is the content-free wake for end-to-end encrypted chats (D109): it
// carries no sender, group or text and opens the encrypted chats list.
export type PushRedirect = "profile" | "waves" | "e2ee";

export interface DevicePushData {
  notification_id: string;
  redirect: PushRedirect;
  target_profile_id: string;
  target_profile_handle: string;
  handle?: string;
  subroute?: "rep" | "identity" | "subscriptions";
  wave_id?: string;
  competition_id?: string;
  competition_entry_id?: string;
  drop_id?: string;
}
