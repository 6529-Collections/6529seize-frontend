"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Image from "next/image";
import Link from "next/link";
import { Button, Container, Modal } from "react-bootstrap";

const GITHUB_BASE =
  "https://github.com/6529-Collections/thememecards/tree/main";

export type GithubUploadResult = {
  success: boolean;
  message?: string;
  error?: string;
  github_folder?: string;
  deleted_files?: string[];
  uploaded_files?: string[];
};

export function GithubUploadModal(
  props: Readonly<{
    show: boolean;
    onClose: () => void;
    onRetry?: () => void;
    isLoading: boolean;
    result: GithubUploadResult | null;
    apiError: string | null;
  }>
) {
  const { show, onClose, onRetry, isLoading, result, apiError } = props;
  const isError = !!apiError || (!!result && !result.success);
  const errorMessage = apiError ?? result?.error ?? "Upload failed";
  const canClose = !isLoading;

  let modalTitle: string;
  if (isLoading) {
    modalTitle = "Publish to GitHub";
  } else if (result?.success) {
    modalTitle = "Published to GitHub";
  } else {
    modalTitle = "Upload failed";
  }

  return (
    <Modal
      show={show}
      onHide={canClose ? onClose : () => {}}
      backdrop={isLoading ? "static" : true}
      keyboard={canClose}
    >
      <Modal.Header closeButton={canClose}>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          {modalTitle}
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body>
        <Container>
          {isLoading && (
            <div className="tw-flex tw-items-center tw-gap-3 tw-py-4">
              <CircleLoader />
              <span className="tw-text-iron-800">Uploading to GitHub…</span>
            </div>
          )}
          {!isLoading && isError && (
            <div className="tw-border-red-500/30 tw-bg-red-950/30 tw-text-red-400 tw-mb-0 tw-break-words tw-rounded tw-border tw-px-3 tw-py-2 tw-text-base">
              {errorMessage}
            </div>
          )}
          {!isLoading && result?.success && (
            <div className="tw-flex tw-flex-col tw-gap-4 tw-pb-2 tw-pt-2">
              {result.message && (
                <p className="tw-mb-0 tw-text-iron-900">{result.message}</p>
              )}
              {result.github_folder && (
                <div className="tw-flex tw-items-center tw-gap-2">
                  <Link
                    href={`${GITHUB_BASE}/${result.github_folder
                      .split("/")
                      .map((seg) => encodeURIComponent(seg))
                      .join("/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline tw-ring-1 tw-ring-iron-600 tw-transition hover:tw-bg-iron-700 hover:tw-text-white hover:tw-no-underline"
                  >
                    <Image
                      src="/github_w.png"
                      alt=""
                      width={18}
                      height={18}
                      unoptimized
                      className="tw-shrink-0"
                    />
                    View {result.github_folder} on GitHub
                  </Link>
                </div>
              )}
              {result.deleted_files && result.deleted_files.length > 0 && (
                <div>
                  <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-700">
                    Deleted files ({result.deleted_files.length})
                  </p>
                  <ul className="tw-mb-0 tw-list-disc tw-space-y-0.5 tw-pl-4 tw-text-sm tw-text-iron-800">
                    {result.deleted_files.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.uploaded_files && result.uploaded_files.length > 0 && (
                <div>
                  <p className="tw-mb-1 tw-text-sm tw-font-medium tw-text-iron-700">
                    Uploaded files ({result.uploaded_files.length})
                  </p>
                  <ul className="tw-mb-0 tw-list-disc tw-space-y-0.5 tw-pl-4 tw-text-sm tw-text-iron-800">
                    {result.uploaded_files.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Container>
      </Modal.Body>
      {!isLoading && (
        <Modal.Footer>
          {isError && onRetry && (
            <Button variant="primary" onClick={onRetry} className="me-2">
              Retry
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
