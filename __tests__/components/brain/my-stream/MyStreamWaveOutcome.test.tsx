import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamWaveOutcome from '@/components/brain/my-stream/MyStreamWaveOutcome';

jest.mock('@/components/waves/outcome/WaveOutcome', () => ({
  __esModule: true,
  WaveOutcome: ({ outcome }: any) => <div data-testid="outcome">{outcome.type}</div>
}));

jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: () => ({ outcomeViewStyle: { height: 50 } })
}));

describe('MyStreamWaveOutcome', () => {
  it('renders outcomes with provided style', () => {
    const wave = { outcomes: [{ credit:1, type:'A' }, { credit:2, type:'B' }] } as any;
    const { container } = render(<MyStreamWaveOutcome wave={wave} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.height).toBe('50px');
    const outs = screen.getAllByTestId('outcome');
    expect(outs).toHaveLength(2);
    expect(outs[0]).toHaveTextContent('A');
  });
});
