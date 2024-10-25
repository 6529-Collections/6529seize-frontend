import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { Modal } from "react-bootstrap";

const QRCode = require("qrcode");

export default function HeaderQR() {
  const router = useRouter();
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const watermarkSrc = "watermark.png";

  const openQR = () => {
    const url = `mobile6529://${router.asPath}`;

    // Create a hidden canvas to add the QR code and watermark
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");

    QRCode.toCanvas(canvas, url, {
      width: 500,
      margin: 0,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then(() => {
        const watermark = document.createElement("img") as HTMLImageElement;
        watermark.src = watermarkSrc;
        watermark.onload = () => {
          // Draw the watermark image on top of the QR code
          const watermarkSize = 40; // Customize size as needed
          ctx?.drawImage(
            watermark,
            (canvas.width - watermarkSize) / 2,
            (canvas.height - watermarkSize) / 2,
            watermarkSize,
            watermarkSize
          );

          // Convert the final canvas to a data URL
          setQrCodeSrc(canvas.toDataURL());
          setShowQRModal(true);
        };
      })
      .catch((err: any) => {
        console.error("Error generating QR code:", err);
      });
  };

  return (
    <div className="tailwind-scope tw-relative xl:tw-mr-3 tw-self-center">
      <button
        type="button"
        aria-label="Search"
        title="Search"
        onClick={openQR}
        className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
        <FontAwesomeIcon icon={faQrcode} height={18} />
      </button>
      <HeaderQRModal
        src={qrCodeSrc}
        show={showQRModal}
        onCancel={() => setShowQRModal(false)}
      />
    </div>
  );
}

export function HeaderQRModal({
  src,
  show,
  onCancel,
}: {
  readonly src: string;
  readonly show: boolean;
  readonly onCancel: () => void;
}) {
  return (
    <Modal show={show} onHide={onCancel} backdrop keyboard={false} centered>
      <Modal.Body>
        <Image
          src={src}
          alt="QR Code"
          width={500}
          height={500}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </Modal.Body>
    </Modal>
  );
}
