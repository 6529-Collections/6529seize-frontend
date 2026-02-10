import React from 'react';
import { render } from '@testing-library/react';
import ComponentConfigMeta from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta';

describe('ComponentConfigMeta', () => {
  it('renders container with expected classes', () => {
    const { container } = render(
      <ComponentConfigMeta tags={[{ id: '1', name: 'tag' }]} walletsCount={10} isLoading={false} />
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('tw-space-y-1 tw-self-center');
  });

  it('renders without crashing when loading', () => {
    const { container } = render(
      <ComponentConfigMeta tags={[]} walletsCount={null} isLoading={true} />
    );
    const div = container.querySelector('div');
    expect(div).toBeTruthy();
  });
});
