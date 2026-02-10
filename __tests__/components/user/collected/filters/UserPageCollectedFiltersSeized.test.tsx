import React from 'react';
import { render } from '@testing-library/react';
import UserPageCollectedFiltersSeized from '@/components/user/collected/filters/UserPageCollectedFiltersSeized';
import { CollectionSeized } from '@/entities/IProfile';

let capturedProps: any = null;

jest.mock('@/components/utils/select/dropdown/CommonDropdown', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="dropdown" />;
});

describe('UserPageCollectedFiltersSeized', () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it('passes items and active selection to dropdown', () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(
      <UserPageCollectedFiltersSeized
        selected={CollectionSeized.NOT_SEIZED}
        containerRef={ref}
        setSelected={jest.fn()}
      />
    );
    const values = capturedProps.items.map((i: any) => i.value);
    expect(values).toEqual([null, ...Object.values(CollectionSeized)]);
    expect(capturedProps.activeItem).toBe(CollectionSeized.NOT_SEIZED);
    expect(capturedProps.filterLabel).toBe('Seized');
    expect(capturedProps.containerRef).toBe(ref);
  });
});
