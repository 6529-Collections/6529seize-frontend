export type PushRedirect = "profile" | "waves";

export interface DevicePushData {
  notification_id: string;
  redirect: PushRedirect;
  target_profile_id: string;
  target_profile_handle: string;
  handle?: string;
  subroute?: "rep" | "identity";
  wave_id?: string;
  drop_id?: string;
}

export interface DevicePushPayload {
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: DevicePushData;
}
