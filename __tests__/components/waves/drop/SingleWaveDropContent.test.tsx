import { render } from "@testing-library/react";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { SingleWaveDropContent } from "@/components/waves/drop/SingleWaveDropContent";

const waveContentMock = jest.fn();
const metadataMock = jest.fn();
const identityMock = jest.fn();

jest.mock("@/components/waves/drops/WaveDropContent", () => (props: any) => {
  waveContentMock(props);
  return <div data-testid="wave" />;
});

jest.mock("@/components/waves/drop/SingleWaveDropContentMetadata", () => ({
  SingleWaveDropContentMetadata: (props: any) => {
    metadataMock(props);
    return <div data-testid="meta" />;
  },
}));

jest.mock("@/components/waves/drops/identity/WaveDropIdentity", () => ({
  WaveDropIdentity: (props: any) => {
    identityMock(props);
    return <div data-testid="identity" />;
  },
}));

describe("SingleWaveDropContent", () => {
  const baseDrop: any = {
    wave: { submission_type: null },
    metadata: [
      { data_key: "title", data_value: "Drop title" },
      { data_key: "description", data_value: "Drop description" },
    ],
    parts: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders metadata when available", () => {
    render(<SingleWaveDropContent drop={baseDrop} />);

    expect(identityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        drop: baseDrop,
        variant: "full",
      })
    );
    expect(metadataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: baseDrop.metadata,
      })
    );
    expect(waveContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ activePartIndex: 0 })
    );
  });

  it("hides metadata when none remain after identity filtering", () => {
    render(
      <SingleWaveDropContent
        drop={{
          ...baseDrop,
          wave: {
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
          metadata: [{ data_key: "identity", data_value: "0xabc" }],
        }}
      />
    );

    expect(identityMock).toHaveBeenCalledTimes(1);
    expect(metadataMock).not.toHaveBeenCalled();
  });

  it("filters reserved identity metadata before rendering metadata cards", () => {
    render(
      <SingleWaveDropContent
        drop={{
          ...baseDrop,
          wave: {
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
          metadata: [
            { data_key: "identity", data_value: "0xabc" },
            { data_key: "title", data_value: "Drop title" },
          ],
        }}
      />
    );

    expect(metadataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: [{ data_key: "title", data_value: "Drop title" }],
      })
    );
  });
});
