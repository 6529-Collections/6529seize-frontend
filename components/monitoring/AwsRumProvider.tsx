'use client';

import { useEffect } from 'react';
import { AwsRum, AwsRumConfig } from 'aws-rum-web';

interface AwsRumProviderProps {
  readonly children: React.ReactNode;
}

export default function AwsRumProvider({ children }: Readonly<AwsRumProviderProps>) {
  useEffect(() => {
    // Only initialize AWS RUM on the client side
    if (typeof window === 'undefined') return;

    // Skip initialization in development mode to avoid noise
    if (process.env.NODE_ENV === 'development') {
      console.log('AWS RUM: Skipped initialization in development mode');
      return;
    }

    try {
      // Check if required environment variables are set
      const APPLICATION_ID = process.env.NEXT_PUBLIC_AWS_RUM_APP_ID;
      const APPLICATION_REGION = process.env.NEXT_PUBLIC_AWS_RUM_REGION || 'us-east-1';
      const APPLICATION_VERSION = process.env.VERSION || '1.0.0';

      if (!APPLICATION_ID) {
        console.log('AWS RUM: Skipped initialization - missing required environment variables');
        return;
      }

      const config: AwsRumConfig = {
        sessionSampleRate: 0.2,
        endpoint: "https://dataplane.rum.eu-west-1.amazonaws.com/",
        telemetries: ["performance", "errors", "http"],
        allowCookies: true,
        enableXRay: false,
        signing: false
      };

      // Initialize AWS RUM
      const awsRum = new AwsRum(
        APPLICATION_ID,
        APPLICATION_VERSION,
        APPLICATION_REGION,
        config
      );
      // Optional: Store the instance globally for manual tracking if needed
      (window as any).awsRum = awsRum;

    } catch (error) {
      // Silently handle errors to prevent breaking the application
      console.warn('AWS RUM: Failed to initialize', error);
    }
  }, []);

  return <>{children}</>;
}