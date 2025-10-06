import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SingleWaveDropHeader } from '@/components/waves/drop/SingleWaveDropHeader';

jest.mock('@/components/waves/drop/SingleWaveDropTabs', () => ({
  SingleWaveDropTabs: (props: any) => (
    <div data-testid="tabs" data-active={props.activeTab} onClick={() => props.setActiveTab('clicked')} />
  )
}));

jest.mock('@/components/waves/drop/SingleWaveDropClose', () => ({
  SingleWaveDropClose: (props: any) => (
    <button data-testid="close" onClick={props.onClose}>x</button>
  )
}));

describe('SingleWaveDropHeader', () => {
  it('renders tabs and close button', () => {
    const setTab = jest.fn();
    const onClose = jest.fn();
    render(
      <SingleWaveDropHeader activeTab="info" setActiveTab={setTab} onClose={onClose} />
    );
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-active', 'info');
    fireEvent.click(screen.getByTestId('tabs'));
    expect(setTab).toHaveBeenCalledWith('clicked');
    fireEvent.click(screen.getByTestId('close'));
    expect(onClose).toHaveBeenCalled();
  });
});
