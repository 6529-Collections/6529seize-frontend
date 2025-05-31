jest.mock("../../../components/waves/drop/SingleWaveDrop", () => ({ SingleWaveDropTab: { INFO: "INFO", CHAT: "CHAT" } }));
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleWaveDropTabs } from '../../../components/waves/drop/SingleWaveDropTabs';
import { SingleWaveDropTab } from '../../../components/waves/drop/SingleWaveDrop';

describe('SingleWaveDropTabs', () => {
  it('calls setActiveTab on click', async () => {
    const setActive = jest.fn();
    render(<SingleWaveDropTabs activeTab={SingleWaveDropTab.INFO} setActiveTab={setActive} />);
    await userEvent.click(screen.getByText('Discussion'));
    expect(setActive).toHaveBeenCalledWith(SingleWaveDropTab.CHAT);
  });
});
