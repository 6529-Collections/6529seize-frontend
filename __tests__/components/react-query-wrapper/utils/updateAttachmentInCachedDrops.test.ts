import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  findDropInCachedDrops,
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
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

  it("finds cached drop reaction state across cached drop query groups", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData([QueryKey.FEED_ITEMS, { page: 1 }], {
      pages: [
        [
          {
            item: {
              id: "drop-2",
              context_profile_context: {
                rating: 0,
                min_rating: 0,
                max_rating: 0,
                reaction: ":joy:",
                boosted: false,
                bookmarked: false,
                curatable: false,
                curated: false,
              },
              reactions: [
                {
                  reaction: ":joy:",
                  profiles: [{ id: "profile-1", handle: "alice" }],
                },
              ],
            },
          },
        ],
      ],
    });

    expect(findDropInCachedDrops(queryClient, "drop-2")).toEqual({
      context_profile_context: expect.objectContaining({
        reaction: ":joy:",
      }),
      reactions: [
        {
          reaction: ":joy:",
          profiles: [{ id: "profile-1", handle: "alice" }],
        },
      ],
    });
  });
});
