import React from 'react';
import { render } from '@testing-library/react';
import { SingleWaveDropInfoContainer } from '../../../../components/waves/drop/SingleWaveDropInfoContainer';
import { SingleWaveDropTab } from '../../../../components/waves/drop/SingleWaveDrop';
import { useLayout } from '../../../../components/brain/my-stream/layout/LayoutContext';

jest.mock('../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: jest.fn(),
}));

const useLayoutMock = useLayout as jest.Mock;

describe('SingleWaveDropInfoContainer', () => {
  beforeEach(() => {
    useLayoutMock.mockReturnValue({ spaces: { measurementsComplete: true, headerSpace: 20 } });
  });

  it('shows when INFO tab active with correct height', () => {
    const { container } = render(
      <SingleWaveDropInfoContainer activeTab={SingleWaveDropTab.INFO}>child</SingleWaveDropInfoContainer>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('tw-block');
  });

  it('hidden when other tab', () => {
    const { container } = render(
      <SingleWaveDropInfoContainer activeTab={SingleWaveDropTab.CHAT}>child</SingleWaveDropInfoContainer>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('tw-hidden');
  });
});
