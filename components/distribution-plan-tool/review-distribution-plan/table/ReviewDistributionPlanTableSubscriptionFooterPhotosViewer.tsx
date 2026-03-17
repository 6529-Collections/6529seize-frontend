"use client";

import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { MEMES_CONTRACT } from "@/constants/constants";
import { DistributionPhoto } from "@/generated/models/DistributionPhoto";
import { formatAddress } from "@/helpers/Helpers";
import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function getPhotoFileName(link: string): string {
  const withoutHash = link.split("#")[0] ?? link;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  const lastSegment = withoutQuery.split("/").pop() ?? "";
  if (!lastSegment) return link;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

function formatLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function DistributionPhotosViewerModal(
  props: Readonly<{
    confirmedTokenId: string;
    photos: DistributionPhoto[];
    isLoading: boolean;
    error: string | null;
    handleClose(): void;
  }>
) {
  const [expandedPhoto, setExpandedPhoto] = useState<DistributionPhoto | null>(
    null
  );
  const closeExpandedPhoto = () => setExpandedPhoto(null);

  return (
    <>
      <Modal show onHide={props.handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="tw-text-lg tw-font-semibold">
          Distribution Photos
        </Modal.Title>
      </Modal.Header>
      <hr className="mb-0 mt-0" />
      <Modal.Body data-testid="distribution-photos-viewer-modal">
        <Container>
          <Row className="pt-2 pb-2">
            <Col className="tw-text-sm tw-text-iron-500">
              Contract: The Memes - {formatAddress(MEMES_CONTRACT)} | Token ID:{" "}
              {props.confirmedTokenId}
            </Col>
          </Row>
          {props.isLoading ? (
            <Row className="pt-4 pb-4">
              <Col className="d-flex align-items-center justify-content-center gap-2">
                <CircleLoader />
                <span>Loading distribution photos...</span>
              </Col>
            </Row>
          ) : props.error ? (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-danger mb-0">{props.error}</div>
              </Col>
            </Row>
          ) : props.photos.length === 0 ? (
            <Row className="pt-2 pb-2">
              <Col>
                <div className="alert alert-secondary mb-0 border border-dark">
                  No distribution photos found for this token.
                </div>
              </Col>
            </Row>
          ) : (
            <>
              <Row className="pt-2 pb-2">
                <Col>
                  <div className="tw-inline-flex tw-rounded-full tw-bg-sky-200 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-sky-950">
                    {formatLabel(props.photos.length, "photo", "photos")}
                  </div>
                </Col>
              </Row>
              <Row className="pt-2 pb-2">
                <Col>
                  <div className="tw-grid tw-grid-cols-2 tw-gap-2 md:tw-grid-cols-3 lg:tw-grid-cols-4">
                    {props.photos.map((photo) => {
                      const photoFileName = getPhotoFileName(photo.link);
                      return (
                        <div
                          key={photo.id}
                          className="tw-relative tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedPhoto(photo)}
                            className="tw-block tw-w-full tw-cursor-zoom-in tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0"
                          >
                            <div className="tw-aspect-[4/3] tw-overflow-hidden tw-rounded-md tw-bg-iron-950">
                              <img
                                src={photo.link}
                                alt={photoFileName}
                                loading="lazy"
                                className="tw-h-full tw-w-full tw-object-contain"
                              />
                            </div>
                          </button>
                          <a
                            href={photo.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Open distribution photo ${photoFileName} in new tab`}
                            title={photo.link}
                            className="tw-absolute tw-right-3 tw-top-3 tw-inline-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
                          >
                            <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.handleClose}>
          Close
        </Button>
      </Modal.Footer>
      </Modal>
      <DistributionPhotoLightbox
        photo={expandedPhoto}
        photoFileName={
          expandedPhoto ? getPhotoFileName(expandedPhoto.link) : ""
        }
        onClose={closeExpandedPhoto}
      />
    </>
  );
}

function DistributionPhotoLightbox({
  photo,
  photoFileName,
  onClose,
}: Readonly<{
  photo: DistributionPhoto | null;
  photoFileName: string;
  onClose: () => void;
}>) {
  useEffect(() => {
    if (!photo) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [photo, onClose]);

  if (!photo || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="tailwind-scope tw-fixed tw-inset-0 tw-z-[2000] tw-flex tw-items-center tw-justify-center">
      <button
        type="button"
        aria-label="Close photo lightbox"
        tabIndex={-1}
        onClick={onClose}
        className="tw-absolute tw-inset-0 tw-border-0 tw-bg-black/85 tw-p-0"
      />
      <div className="tw-relative tw-z-[2001] tw-w-[min(90vw,980px)] tw-overflow-hidden tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-2.5">
        <img
          src={photo.link}
          alt={photoFileName}
          className="tw-h-[min(76vh,760px)] tw-w-full tw-object-contain"
        />
        <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-3 tw-flex tw-gap-2">
          <a
            href={photo.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open distribution photo ${photoFileName} in new tab`}
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900/90 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image preview"
            className="tw-pointer-events-auto tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-iron-900/90 tw-text-iron-100 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-iron-500"
          >
            <XMarkIcon className="tw-h-5 tw-w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
