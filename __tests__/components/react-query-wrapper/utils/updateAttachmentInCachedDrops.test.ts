import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  reconcileAttachmentStatusUpdate,
  reconcileFinalizedDropAttachments,
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import { replaceAttachmentInDrops } from "@/contexts/wave/hooks/useWaveRealtimeUpdater.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { QueryClient } from "@tanstack/react-query";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("cached drop websocket updates", () => {
  it("replaces cached drops by id and preserves stable rendering keys", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-1",
            type: "FULL",
            stableKey: "stable-key",
            stableHash: "stable-hash",
            serial_no: 1,
            parts: [
              {
                content: "",
                attachments: [
                  {
                    attachment_id: "attachment-1",
                    file_name: "sample.pdf",
                    mime_type: "application/pdf",
                    kind: "PDF",
                    status: "PROCESSING",
                    url: null,
                    error_reason: null,
                  },
                ],
              },
            ],
          },
        ],
      ],
    });

    updateDropInCachedDrops(queryClient, {
      id: "drop-1",
      serial_no: 1,
      parts: [
        {
          content: "",
          attachments: [
            {
              attachment_id: "attachment-1",
              file_name: "sample.pdf",
              mime_type: "application/pdf",
              kind: "PDF",
              status: "READY",
              url: "https://example.com/sample.pdf",
              error_reason: null,
            },
          ],
        },
      ],
    } as any);

    expect(queryClient.getQueryData<any>(queryKey).pages[0][0]).toMatchObject({
      id: "drop-1",
      type: "FULL",
      stableKey: "stable-key",
      stableHash: "stable-hash",
      parts: [
        {
          attachments: [
            {
              attachment_id: "attachment-1",
              status: "READY",
              url: "https://example.com/sample.pdf",
            },
          ],
        },
      ],
    });
  });

  it("preserves authenticated poll votes when websocket updates include stale votes", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-1",
            serial_no: 1,
            poll: {
              id: "poll-1",
              options: [
                { option_no: 1, option_string: "First", votes: 2 },
                { option_no: 2, option_string: "Second", votes: 2 },
              ],
              voted: [2],
              multichoice: false,
              anonymous: false,
              closing_time: 1000,
              is_open: true,
            },
          },
        ],
      ],
    });

    updateDropInCachedDrops(
      queryClient,
      {
        id: "drop-1",
        serial_no: 1,
        poll: {
          id: "poll-1",
          options: [
            { option_no: 1, option_string: "First", votes: 3 },
            { option_no: 2, option_string: "Second", votes: 2 },
          ],
          voted: [1],
          multichoice: false,
          anonymous: false,
          closing_time: 1000,
          is_open: true,
        },
      } as any,
      {
        preferExistingPollVote: true,
      }
    );

    expect(queryClient.getQueryData<any>(queryKey).pages[0][0].poll).toEqual({
      id: "poll-1",
      options: [
        { option_no: 1, option_string: "First", votes: 3 },
        { option_no: 2, option_string: "Second", votes: 2 },
      ],
      voted: [2],
      multichoice: false,
      anonymous: false,
      closing_time: 1000,
      is_open: true,
    });
  });

  it("updates cached attachments by attachment id", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROP, { drop_id: "drop-1" }];
    queryClient.setQueryData(queryKey, {
      id: "drop-1",
      parts: [
        {
          attachments: [
            {
              attachment_id: "attachment-1",
              file_name: "sample.csv",
              mime_type: "text/csv",
              kind: "CSV",
              status: "PROCESSING",
              url: null,
              error_reason: null,
            },
          ],
        },
      ],
    });

    updateAttachmentInCachedDrops(queryClient, {
      attachment_id: "attachment-1",
      file_name: "sample.csv",
      mime_type: "text/csv",
      kind: "CSV",
      status: "BAD",
      url: null,
      error_reason: "Blocked",
    } as any);

    expect(
      queryClient.getQueryData<any>(queryKey).parts[0].attachments[0]
    ).toMatchObject({
      attachment_id: "attachment-1",
      status: "BAD",
      error_reason: "Blocked",
    });
  });

  it("does not downgrade a ready attachment when a delayed status arrives", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROP, { drop_id: "drop-1" }];
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.csv",
      mime_type: "text/csv",
      kind: "CSV",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.csv",
      error_reason: null,
    };
    queryClient.setQueryData(queryKey, {
      id: "drop-1",
      parts: [{ attachments: [readyAttachment] }],
    });

    updateAttachmentInCachedDrops(queryClient, {
      ...readyAttachment,
      status: ApiAttachmentStatus.Processing,
      url: null,
    } as any);

    expect(
      queryClient.getQueryData<any>(queryKey).parts[0].attachments[0]
    ).toEqual(readyAttachment);
  });

  it("accepts a terminal correction after another terminal status", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      status: ApiAttachmentStatus.Ready,
    } as any;
    const badAttachment = {
      ...readyAttachment,
      status: ApiAttachmentStatus.Bad,
      error_reason: "Blocked",
    };

    expect(
      reconcileAttachmentStatusUpdate(readyAttachment, badAttachment)
    ).toBe(badAttachment);
  });

  it("does not downgrade a ready attachment in the active wave store", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.pdf",
      mime_type: "application/pdf",
      kind: "PDF",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.pdf",
      error_reason: null,
    };
    const drop = {
      id: "drop-1",
      type: DropSize.FULL,
      parts: [{ attachments: [readyAttachment] }],
    } as any;

    const result = replaceAttachmentInDrops([drop], {
      ...readyAttachment,
      status: ApiAttachmentStatus.Verifying,
      url: null,
    } as any);

    expect(result.changed).toBe(false);
    expect(result.drops[0]).toBe(drop);
  });

  it("preserves finalized attachments when a stale drop update downgrades them", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.pdf",
      mime_type: "application/pdf",
      kind: "pdf",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.pdf",
    };
    const existingDrop = {
      id: "drop-1",
      updated_at: 100,
      parts: [
        {
          part_id: 1,
          content: "",
          media: [],
          attachments: [readyAttachment],
        },
      ],
    };
    const staleDrop = {
      id: "drop-1",
      updated_at: 100,
      parts: [
        {
          part_id: 1,
          content: "",
          media: [],
          attachments: [
            {
              ...readyAttachment,
              status: ApiAttachmentStatus.Processing,
              url: null,
            },
          ],
        },
      ],
    };

    const result = reconcileFinalizedDropAttachments(
      staleDrop as ApiDrop,
      existingDrop
    );

    expect(result.parts[0]?.attachments).toEqual([readyAttachment]);
  });

  it("preserves omitted finalized attachments when updated_at is null", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.csv",
      mime_type: "text/csv",
      kind: "csv",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.csv",
    };
    const existingDrop = {
      id: "drop-1",
      updated_at: null,
      parts: [
        {
          part_id: 1,
          content: "",
          media: [],
          attachments: [readyAttachment],
        },
      ],
    };
    const staleDrop = {
      id: "drop-1",
      updated_at: null,
      parts: [{ part_id: 1, content: "", media: [], attachments: [] }],
    };

    const result = reconcileFinalizedDropAttachments(
      staleDrop as ApiDrop,
      existingDrop
    );

    expect(result.parts[0]?.attachments).toEqual([readyAttachment]);
  });

  it("matches reordered parts by part id", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.pdf",
      mime_type: "application/pdf",
      kind: "pdf",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.pdf",
    };
    const existingDrop = {
      id: "drop-1",
      updated_at: 100,
      parts: [
        { part_id: 1, attachments: [readyAttachment] },
        { part_id: 2, attachments: [] },
      ],
    };
    const staleDrop = {
      id: "drop-1",
      updated_at: 100,
      parts: [
        { part_id: 2, attachments: [] },
        {
          part_id: 1,
          attachments: [
            {
              ...readyAttachment,
              status: ApiAttachmentStatus.Processing,
              url: null,
            },
          ],
        },
      ],
    };

    const result = reconcileFinalizedDropAttachments(
      staleDrop as ApiDrop,
      existingDrop
    );

    expect(result.parts[0]?.attachments).toEqual([]);
    expect(result.parts[1]?.attachments).toEqual([readyAttachment]);
  });

  it("trusts newer drop payloads that intentionally remove an attachment", () => {
    const existingDrop = {
      id: "drop-1",
      updated_at: 100,
      parts: [
        {
          part_id: 1,
          attachments: [
            {
              attachment_id: "attachment-1",
              status: ApiAttachmentStatus.Ready,
            },
          ],
        },
      ],
    };
    const newerDrop = {
      id: "drop-1",
      updated_at: 101,
      parts: [{ part_id: 1, attachments: [] }],
    };

    expect(
      reconcileFinalizedDropAttachments(newerDrop as ApiDrop, existingDrop)
        .parts[0]?.attachments
    ).toEqual([]);
  });

  it("preserves finalized attachments through the cached-drop update path", () => {
    const queryClient = createQueryClient();
    const queryKey = [QueryKey.DROPS, { waveId: "wave-1" }];
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.pdf",
      mime_type: "application/pdf",
      kind: "pdf",
      status: ApiAttachmentStatus.Ready,
      url: "https://example.com/sample.pdf",
    };
    queryClient.setQueryData(queryKey, {
      pages: [
        [
          {
            id: "drop-1",
            updated_at: 100,
            parts: [
              { part_id: 1, content: "", attachments: [readyAttachment] },
            ],
          },
        ],
      ],
    });

    updateDropInCachedDrops(
      queryClient,
      {
        id: "drop-1",
        updated_at: 100,
        parts: [
          {
            part_id: 1,
            content: "",
            attachments: [
              {
                ...readyAttachment,
                status: ApiAttachmentStatus.Processing,
                url: null,
              },
            ],
          },
        ],
      } as ApiDrop,
      { mergeWithExisting: true }
    );

    expect(
      queryClient.getQueryData<any>(queryKey).pages[0][0].parts[0].attachments
    ).toEqual([readyAttachment]);
  });

  it("returns partial drops without parts unchanged", () => {
    const partialDrop = { id: "drop-1", parts: undefined } as any;

    expect(
      reconcileFinalizedDropAttachments(partialDrop, {
        parts: [{ part_id: 1, attachments: [] }],
      })
    ).toBe(partialDrop);
  });
});
