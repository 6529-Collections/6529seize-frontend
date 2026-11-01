import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDeviceSignature } from "@/generated/models/ApiDeviceSignature";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiUpdateDropRequest } from "@/generated/models/ApiUpdateDropRequest";
import {
  omitDeviceSignature,
  withDeviceSignature,
} from "@/lib/device-signing/device-signature-body";
import { DeviceEventKind } from "@/lib/device-signing/interim-event";
import { sendDeviceSignedWrite } from "@/lib/device-signing/sign-write";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";

type ApiErrorMode = NonNullable<
  Parameters<typeof commonApiPost>[0]["errorMode"]
>;

interface DropWriteOptions {
  readonly signal?: AbortSignal | undefined;
  readonly errorMode?: ApiErrorMode | undefined;
}

interface ExistingDropTarget {
  readonly dropId: string;
  /** The drop's stored wave id. */
  readonly waveId: string;
}

const signedBody = (body: object): object =>
  omitDeviceSignature(body) as object;

const deleteBody = (
  deviceSignature: ApiDeviceSignature | null
): { readonly body?: object } =>
  deviceSignature ? { body: { device_signature: deviceSignature } } : {};

/** POST /drops, signed by this device when it holds an active grant. */
export function postDrop(
  body: ApiCreateDropRequest,
  {
    endpoint = "drops",
    ...options
  }: DropWriteOptions & {
    readonly endpoint?: string;
  } = {}
): Promise<ApiDrop> {
  const replyToDropId = body.reply_to?.drop_id;
  return sendDeviceSignedWrite(
    {
      kind: DeviceEventKind.POST,
      wave: body.wave_id,
      refs: replyToDropId ? [replyToDropId] : [],
      body: signedBody(body),
      signal: options.signal,
    },
    (deviceSignature) =>
      commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint,
        body: withDeviceSignature(body, deviceSignature),
        ...options,
      })
  );
}

/** POST /drops/{id} (edit). */
export function postDropUpdate(
  { dropId, waveId }: ExistingDropTarget,
  body: ApiUpdateDropRequest,
  options: DropWriteOptions = {}
): Promise<ApiDrop> {
  return sendDeviceSignedWrite(
    {
      kind: DeviceEventKind.EDIT,
      wave: waveId,
      refs: [dropId],
      body: signedBody(body),
      signal: options.signal,
    },
    (deviceSignature) =>
      commonApiPost<ApiUpdateDropRequest, ApiDrop>({
        endpoint: `drops/${dropId}`,
        body: withDeviceSignature(body, deviceSignature),
        ...options,
      })
  );
}

/** DELETE /drops/{id}. Unsigned deletes keep sending no body. */
export function deleteDrop(
  { dropId, waveId }: ExistingDropTarget,
  options: DropWriteOptions = {}
): Promise<void> {
  return sendDeviceSignedWrite(
    {
      kind: DeviceEventKind.TOMBSTONE,
      wave: waveId,
      refs: [dropId],
      body: null,
      signal: options.signal,
    },
    (deviceSignature) =>
      commonApiDelete({
        endpoint: `drops/${dropId}`,
        ...options,
        ...deleteBody(deviceSignature),
      })
  );
}

/**
 * Adds (POST) or, with a null reaction, removes (DELETE) the caller's
 * reaction. The signed body is {"on":true,"reaction":R} or {"on":false}.
 */
export function sendDropReaction(
  {
    dropId,
    waveId,
    reaction,
  }: ExistingDropTarget & {
    readonly reaction: string | null;
  },
  options: DropWriteOptions = {}
): Promise<void> {
  const endpoint = `drops/${dropId}/reaction`;
  const target = {
    kind: DeviceEventKind.REACT,
    wave: waveId,
    refs: [dropId],
    signal: options.signal,
  };
  if (reaction === null) {
    return sendDeviceSignedWrite(
      { ...target, body: { on: false } },
      (deviceSignature) =>
        commonApiDelete({
          endpoint,
          ...options,
          ...deleteBody(deviceSignature),
        })
    );
  }
  return sendDeviceSignedWrite(
    { ...target, body: { on: true, reaction } },
    async (deviceSignature) => {
      await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
        endpoint,
        body: withDeviceSignature({ reaction }, deviceSignature),
        ...options,
      });
    }
  );
}
