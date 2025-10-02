import { render } from '@testing-library/react';
import { SingleWaveDropContent } from '@/components/waves/drop/SingleWaveDropContent';

const waveMock = jest.fn();
const metaMock = jest.fn();

jest.mock('@/components/waves/drops/WaveDropContent', () => (props: any) => { waveMock(props); return <div data-testid="wave" />; });
jest.mock('@/components/waves/drop/SingleWaveDropContentMetadata', () => ({ SingleWaveDropContentMetadata: (props: any) => { metaMock(props); return <div data-testid="meta" />; } }));

describe('SingleWaveDropContent', () => {
  const baseDrop:any = { metadata: [{},{}], parts: [] };

  beforeEach(() => { jest.clearAllMocks(); });

  it('renders metadata when available', () => {
    render(<SingleWaveDropContent drop={baseDrop} />);
    expect(metaMock).toHaveBeenCalled();
    expect(waveMock).toHaveBeenCalledWith(expect.objectContaining({ activePartIndex: 0 }));
  });

  it('hides metadata when none', () => {
    render(<SingleWaveDropContent drop={{ ...baseDrop, metadata: [] }} />);
    expect(metaMock).not.toHaveBeenCalled();
  });
});
