import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  reconcileFinalizedDropAttachments,
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { ApiDrop } from "@/generated/models/ApiDrop";
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

  it("preserves finalized attachments when a stale drop update downgrades them", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.pdf",
      mime_type: "application/pdf",
      kind: "pdf",
      status: "ready",
      url: "https://example.com/sample.pdf",
    };
    const existingDrop = {
      id: "drop-1",
      parts: [{ content: "", media: [], attachments: [readyAttachment] }],
    };
    const staleDrop = {
      id: "drop-1",
      parts: [
        {
          content: "",
          media: [],
          attachments: [
            { ...readyAttachment, status: "processing", url: null },
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

  it("preserves finalized attachments omitted by a stale full-drop payload", () => {
    const readyAttachment = {
      attachment_id: "attachment-1",
      file_name: "sample.csv",
      mime_type: "text/csv",
      kind: "csv",
      status: "ready",
      url: "https://example.com/sample.csv",
    };
    const existingDrop = {
      id: "drop-1",
      parts: [{ content: "", media: [], attachments: [readyAttachment] }],
    };
    const staleDrop = {
      id: "drop-1",
      parts: [{ content: "", media: [], attachments: [] }],
    };

    const result = reconcileFinalizedDropAttachments(
      staleDrop as ApiDrop,
      existingDrop
    );

    expect(result.parts[0]?.attachments).toEqual([readyAttachment]);
  });
});
