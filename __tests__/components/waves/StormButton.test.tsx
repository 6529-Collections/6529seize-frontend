import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StormButton from '../../../components/waves/StormButton';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <span>{children}</span> }));

describe('StormButton', () => {
  it('calls breakIntoStorm on click', () => {
    const fn = jest.fn();
    render(<StormButton isStormMode={false} canAddPart={true} submitting={false} breakIntoStorm={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalled();
  });

  it('disabled when cannot add', () => {
    const fn = jest.fn();
    render(<StormButton isStormMode={true} canAddPart={false} submitting={true} breakIntoStorm={fn} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
