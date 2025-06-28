"use client";

import { FC, useEffect, useState } from "react";
import TermsOfServiceModal from "./TermsOfServiceModal";
import { useDropSignature } from "../../hooks/drops/useDropSignature";
import { ApiCreateDropRequest } from "../../generated/models/ApiCreateDropRequest";

interface SigningCompleteResult {
  success: boolean;
  signature?: string;
}

/**
 * Component that handles the terms signature flow
 * This is a wrapper component that listens for global events to show terms
 */
const TermsSignatureFlow: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<ApiCreateDropRequest | null>(
    null
  );
  const [pendingCallback, setPendingCallback] = useState<
    ((result: SigningCompleteResult) => void) | null
  >(null);

  const { signDrop, isLoading } = useDropSignature();

  // Listen for the custom event to show the terms modal
  useEffect(() => {
    const handleShowTermsModal = (event: CustomEvent) => {
      if (!event.detail) return;

      const { drop, termsOfService, onComplete } = event.detail;

      if (drop && termsOfService && onComplete) {
        setPendingDrop(drop);
        setTermsContent(termsOfService);
        setPendingCallback(() => onComplete);
        setIsModalOpen(true);
      }
    };

    // Add the event listener
    document.addEventListener(
      "showTermsModal",
      handleShowTermsModal as EventListener
    );

    // Clean up
    return () => {
      document.removeEventListener(
        "showTermsModal",
        handleShowTermsModal as EventListener
      );
    };
  }, []);

  // Handler for when the user accepts the terms
  const handleAccept = async () => {
    if (!pendingDrop || !pendingCallback) return;

    // Sign the drop with terms
    const result = await signDrop({
      drop: pendingDrop,
      termsOfService: termsContent,
    });

    // Close the modal
    setIsModalOpen(false);

    // Call the callback with the result
    pendingCallback(result);

    // Clear the state
    setPendingDrop(null);
    setTermsContent(null);
    setPendingCallback(null);
  };

  // Handler for when the user rejects the terms
  const handleReject = () => {
    setIsModalOpen(false);

    // Call the callback with a failure result
    if (pendingCallback) {
      pendingCallback({ success: false });
    }

    // Clear the state
    setPendingDrop(null);
    setTermsContent(null);
    setPendingCallback(null);
  };

  return (
    <TermsOfServiceModal
      isOpen={isModalOpen}
      onClose={handleReject}
      onAccept={handleAccept}
      termsContent={termsContent}
      isLoading={isLoading}
    />
  );
};

export default TermsSignatureFlow;
