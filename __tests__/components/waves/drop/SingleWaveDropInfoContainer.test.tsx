import React from 'react';
import { render } from '@testing-library/react';
import { SingleWaveDropInfoContainer } from '@/components/waves/drop/SingleWaveDropInfoContainer';

describe('SingleWaveDropInfoContainer', () => {
  it('renders children', () => {
    const { getByText } = render(
      <SingleWaveDropInfoContainer>test content</SingleWaveDropInfoContainer>
    );
    expect(getByText('test content')).toBeInTheDocument();
  });

  it('applies correct styling', () => {
    const { container } = render(
      <SingleWaveDropInfoContainer>child</SingleWaveDropInfoContainer>
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('tw-w-full');
    expect(div.className).toContain('tw-h-full');
  });
});
