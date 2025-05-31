import { render } from '@testing-library/react';
import React from 'react';
import WaveDropsScrollingOverlay from '../../../../components/waves/drops/WaveDropsScrollingOverlay';

jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: 'xxlarge' }
}));

describe('WaveDropsScrollingOverlay', () => {
  it('returns null when not visible', () => {
    const { container } = render(<WaveDropsScrollingOverlay isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders loader when visible', () => {
    const { getByTestId } = render(<WaveDropsScrollingOverlay isVisible />);
    expect(getByTestId('loader')).toBeInTheDocument();
  });
});
