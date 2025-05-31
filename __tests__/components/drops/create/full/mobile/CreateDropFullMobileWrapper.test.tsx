import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropFullMobileWrapper from '../../../../../../components/drops/create/full/mobile/CreateDropFullMobileWrapper';
import { CreateDropType } from '../../../../../../components/drops/create/types';

// use real MobileWrapperDialog

describe('CreateDropFullMobileWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with post title and handles close', () => {
    const onClose = jest.fn();
    render(
      <CreateDropFullMobileWrapper
        isOpen={true}
        type={CreateDropType.DROP}
        onClose={onClose}
        onViewClick={() => {}}
      >
        child
      </CreateDropFullMobileWrapper>
    );

    expect(screen.getByRole('heading', { name: /create a post/i })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Close panel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('uses quote title when type is QUOTE', () => {
    render(
      <CreateDropFullMobileWrapper
        isOpen={true}
        type={CreateDropType.QUOTE}
        onClose={() => {}}
        onViewClick={() => {}}
      >
        child
      </CreateDropFullMobileWrapper>
    );

    expect(screen.getByRole('heading', { name: /create a quote/i })).toBeInTheDocument();
  });
});
