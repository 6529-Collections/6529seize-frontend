import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { publicEnv } from "@/config/env";
import AwsRumProvider from "@/components/monitoring/AwsRumProvider";
import { AwsRum } from "aws-rum-web";

jest.mock("aws-rum-web", () => ({
  AwsRum: jest.fn(() => ({ recordEvent: jest.fn() })),
}));

const mockAwsRum = AwsRum as jest.Mock;
const originalPublicEnv = { ...publicEnv };

describe("AwsRumProvider", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    Object.assign(publicEnv, originalPublicEnv, {
      NODE_ENV: "production",
      AWS_RUM_APP_ID: "test-app-id",
      AWS_RUM_REGION: "eu-west-1",
      AWS_RUM_SAMPLE_RATE: "0.5",
      VERSION: "test-version",
    });
    mockAwsRum.mockClear();
    delete (window as typeof window & { awsRum?: unknown }).awsRum;
    warnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
    Object.assign(publicEnv, originalPublicEnv);
  });

  it("initializes AWS RUM after the provider hydrates", async () => {
    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => expect(mockAwsRum).toHaveBeenCalledTimes(1));

    expect(mockAwsRum).toHaveBeenCalledWith(
      "test-app-id",
      "test-version",
      "eu-west-1",
      expect.objectContaining({
        sessionSampleRate: 0.5,
        releaseId: "test-version",
        telemetries: ["performance", "errors", "http"],
      })
    );
    expect((window as typeof window & { awsRum?: unknown }).awsRum).toBe(
      mockAwsRum.mock.results[0]?.value
    );
  });

  it("skips AWS RUM initialization in development", async () => {
    publicEnv.NODE_ENV = "development";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "AWS RUM: Skipped initialization in development mode"
      );
    });
    expect(mockAwsRum).not.toHaveBeenCalled();
  });

  it("skips AWS RUM initialization when the application id is missing", async () => {
    publicEnv.AWS_RUM_APP_ID = "";

    render(
      <AwsRumProvider>
        <div>Child content</div>
      </AwsRumProvider>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "AWS RUM: Skipped initialization - missing required environment variables"
      );
    });
    expect(mockAwsRum).not.toHaveBeenCalled();
  });
});
