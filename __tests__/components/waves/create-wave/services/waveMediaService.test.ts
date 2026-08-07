import type { CreateDropPart } from '@/entities/IDrop';
import { generateDropPart } from '@/components/waves/create-wave/services/waveMediaService';
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from '@/components/waves/create-wave/services/multiPartUpload';
import type { ApiAttachment } from '@/generated/models/ApiAttachment';
import { ApiAttachmentKind } from '@/generated/models/ApiAttachmentKind';
import { ApiAttachmentStatus } from '@/generated/models/ApiAttachmentStatus';
import { ApiAttachmentUploadMimeType } from '@/generated/models/ApiAttachmentUploadMimeType';

jest.mock('@/components/waves/create-wave/services/multiPartUpload');

const mockedMultiPartUpload = multiPartUpload as jest.MockedFunction<
  typeof multiPartUpload
>;
const mockedMultiPartAttachmentUpload =
  multiPartAttachmentUpload as jest.MockedFunction<
    typeof multiPartAttachmentUpload
  >;

const mockFile = (name: string, type = 'text/plain') =>
  new File(['content'], name, { type });

const buildPart = (media: File[]): CreateDropPart => ({
  content: 'c',
  quoted_drop: null,
  media,
});

const buildAttachment = (
  overrides: Partial<ApiAttachment> = {}
): ApiAttachment => ({
  attachment_id: 'attachment-1',
  file_name: 'doc.pdf',
  mime_type: ApiAttachmentUploadMimeType.ApplicationPdf,
  kind: ApiAttachmentKind.Pdf,
  status: ApiAttachmentStatus.Ready,
  ...overrides,
});

describe('generateDropPart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMultiPartUpload.mockImplementation(({ file }) =>
      Promise.resolve({ url: `url-${file.name}`, mime_type: file.type })
    );
    mockedMultiPartAttachmentUpload.mockImplementation(({ file }) =>
      Promise.resolve(buildAttachment({ file_name: file.name }))
    );
  });

  it('uploads all media and returns new part', async () => {
    const result = await generateDropPart(
      buildPart([mockFile('a.txt'), mockFile('b.txt')])
    );

    expect(result.media).toEqual([
      { url: 'url-a.txt', mime_type: 'text/plain' },
      { url: 'url-b.txt', mime_type: 'text/plain' },
    ]);
    expect(result.content).toBe('c');
  });

  it('returns empty media and attachments when the part has no media', async () => {
    const result = await generateDropPart(buildPart([]));

    expect(result.media).toEqual([]);
    expect(result.attachments).toEqual([]);
    expect(result.uploaded_attachments).toEqual([]);
    expect(mockedMultiPartUpload).not.toHaveBeenCalled();
    expect(mockedMultiPartAttachmentUpload).not.toHaveBeenCalled();
  });

  it('routes attachment files to the attachment upload and media files to the media upload', async () => {
    const result = await generateDropPart(
      buildPart([
        mockFile('image.png', 'image/png'),
        mockFile('doc.pdf', 'application/pdf'),
        mockFile('rows.csv', 'text/csv'),
      ])
    );

    expect(mockedMultiPartUpload).toHaveBeenCalledTimes(1);
    expect(mockedMultiPartUpload).toHaveBeenCalledWith({
      file: expect.objectContaining({ name: 'image.png' }),
      path: 'drop',
    });
    expect(mockedMultiPartAttachmentUpload).toHaveBeenCalledTimes(2);
    expect(result.media).toEqual([
      { url: 'url-image.png', mime_type: 'image/png' },
    ]);
    expect(result.attachments).toEqual([
      { attachment_id: 'attachment-1' },
      { attachment_id: 'attachment-1' },
    ]);
    expect(result.uploaded_attachments).toHaveLength(2);
    expect(result.uploaded_attachments?.[0]?.file_name).toBe('doc.pdf');
  });

  it('throws the attachment error reason when an attachment comes back bad', async () => {
    mockedMultiPartAttachmentUpload.mockResolvedValueOnce(
      buildAttachment({
        status: ApiAttachmentStatus.Bad,
        error_reason: 'Password-protected PDFs are not allowed.',
      })
    );

    await expect(
      generateDropPart(buildPart([mockFile('doc.pdf', 'application/pdf')]))
    ).rejects.toThrow('Password-protected PDFs are not allowed.');
  });

  it('falls back to a file-name message when a bad attachment has no error reason', async () => {
    mockedMultiPartAttachmentUpload.mockResolvedValueOnce(
      buildAttachment({
        file_name: 'broken.pdf',
        status: ApiAttachmentStatus.Bad,
      })
    );

    await expect(
      generateDropPart(buildPart([mockFile('broken.pdf', 'application/pdf')]))
    ).rejects.toThrow('broken.pdf failed attachment validation.');
  });

  it('reports the first bad attachment when several fail', async () => {
    mockedMultiPartAttachmentUpload
      .mockResolvedValueOnce(
        buildAttachment({
          status: ApiAttachmentStatus.Bad,
          error_reason: 'first failure',
        })
      )
      .mockResolvedValueOnce(
        buildAttachment({
          status: ApiAttachmentStatus.Bad,
          error_reason: 'second failure',
        })
      );

    await expect(
      generateDropPart(
        buildPart([
          mockFile('one.pdf', 'application/pdf'),
          mockFile('two.pdf', 'application/pdf'),
        ])
      )
    ).rejects.toThrow('first failure');
  });

  it('propagates media upload failures', async () => {
    mockedMultiPartUpload.mockRejectedValueOnce(new Error('upload exploded'));

    await expect(
      generateDropPart(buildPart([mockFile('a.txt')]))
    ).rejects.toThrow('upload exploded');
  });
});
