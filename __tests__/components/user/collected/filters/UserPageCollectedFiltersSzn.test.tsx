import React from 'react';
import { render } from '@testing-library/react';
import UserPageCollectedFiltersSzn from '@/components/user/collected/filters/UserPageCollectedFiltersSzn';
import { MEMES_SEASON } from '@/enums';

let capturedProps: any = null;

jest.mock('@/components/utils/select/dropdown/CommonDropdown', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="dropdown" />;
});

describe('UserPageCollectedFiltersSzn', () => {
  beforeEach(() => {
    capturedProps = null;
  });

  it('passes items and active selection to dropdown', () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(
      <UserPageCollectedFiltersSzn selected={MEMES_SEASON.SZN1} containerRef={ref} setSelected={jest.fn()} />
    );
    const values = capturedProps.items.map((i: any) => i.value);
    expect(values).toEqual([null, ...Object.values(MEMES_SEASON)]);
    expect(capturedProps.activeItem).toBe(MEMES_SEASON.SZN1);
    expect(capturedProps.filterLabel).toBe('Season');
    expect(capturedProps.containerRef).toBe(ref);
  });
});
