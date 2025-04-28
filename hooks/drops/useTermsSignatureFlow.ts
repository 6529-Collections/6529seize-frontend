import { useState, useCallback } from "react";
import { ApiCreateDropRequest } from "../../generated/models/ApiCreateDropRequest";
import { useDropSignature } from "./useDropSignature";

interface TermsAcknowledgment {
  hasAcknowledged: boolean;
  acknowledgedAt: number | null;
  termsVersion: string | null;
}

/**
 * Helper function to calculate hash of the terms content
 * Used to track terms version for future reference
 */
const getTermsHash = (termsContent: string | null): string | null => {
  if (!termsContent) return null;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(termsContent);
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Hook to manage terms display, acknowledgment, and signature process
 */
export const useTermsSignatureFlow = () => {
  // Terms modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<ApiCreateDropRequest | null>(null);
  const [pendingTerms, setPendingTerms] = useState<string | null>(null);
  const [termsAcknowledgment, setTermsAcknowledgment] = useState<TermsAcknowledgment>({
    hasAcknowledged: false,
    acknowledgedAt: null,
    termsVersion: null,
  });
  const [pendingCallback, setPendingCallback] = useState<((result: { success: boolean; signature?: string }) => void) | null>(null);
  
  // Use the original signature hook
  const { signDrop: originalSignDrop, isLoading } = useDropSignature();

  /**
   * Initiates the terms signature flow
   */
  const prepareAndSignDrop = useCallback(async ({
    drop,
    termsOfService,
    onSigningComplete,
  }: {
    drop: ApiCreateDropRequest;
    termsOfService: string | null;
    onSigningComplete: (result: { success: boolean; signature?: string }) => void;
  }): Promise<void> => {
    // Check if terms exists and requires acknowledgment
    if (termsOfService && termsOfService.trim().length > 0) {
      // Store pending data for later use
      setPendingDrop(drop);
      setPendingTerms(termsOfService);
      setPendingCallback(() => onSigningComplete);
      
      // Calculate terms version hash
      const termsVersion = getTermsHash(termsOfService);

      // Check if user already acknowledged this version of terms
      if (
        !termsAcknowledgment.hasAcknowledged || 
        termsAcknowledgment.termsVersion !== termsVersion
      ) {
        // Open terms modal for user to acknowledge
        setIsTermsModalOpen(true);
        return;
      }
    }
    
    // If no terms or already acknowledged, proceed directly with signing
    const result = await originalSignDrop({ drop, termsOfService });
    onSigningComplete(result);
  }, [originalSignDrop, termsAcknowledgment]);

  /**
   * Called when user acknowledges and accepts the terms
   */
  const onTermsAccepted = useCallback(async (): Promise<void> => {
    if (!pendingDrop || pendingTerms === null || !pendingCallback) {
      // This shouldn't happen, but handle it gracefully
      setIsTermsModalOpen(false);
      return;
    }

    // Record terms acknowledgment
    const termsVersion = getTermsHash(pendingTerms);
    setTermsAcknowledgment({
      hasAcknowledged: true,
      acknowledgedAt: Date.now(),
      termsVersion,
    });

    // Close the modal
    setIsTermsModalOpen(false);

    // Proceed with the signing process
    const result = await originalSignDrop({ 
      drop: pendingDrop, 
      termsOfService: pendingTerms 
    });
    
    pendingCallback(result);
  }, [pendingDrop, pendingTerms, pendingCallback, originalSignDrop]);

  /**
   * Called when user cancels the terms modal
   */
  const onTermsRejected = useCallback((): void => {
    setIsTermsModalOpen(false);
    
    if (pendingCallback) {
      pendingCallback({ success: false });
    }
    
    setPendingDrop(null);
    setPendingTerms(null);
    setPendingCallback(null);
  }, [pendingCallback]);

  return {
    prepareAndSignDrop,
    isTermsModalOpen,
    termsContent: pendingTerms,
    onTermsAccepted,
    onTermsRejected,
    isLoading,
  };
};