import { render } from '@testing-library/react';
import React from 'react';
import BrainLeftSidebarWaveDropTime from '../../../../../components/brain/left-sidebar/waves/BrainLeftSidebarWaveDropTime';
import { getTimeAgoShort } from '../../../../../helpers/Helpers';

jest.mock('../../../../../helpers/Helpers');

describe('BrainLeftSidebarWaveDropTime', () => {
  it('renders time using helper and sets interval', () => {
    (getTimeAgoShort as jest.Mock).mockReturnValue('1m');
    const setSpy = jest.spyOn(global, 'setInterval');
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { unmount, getByText } = render(<BrainLeftSidebarWaveDropTime time={10} />);
    expect(getByText('1m')).toBeInTheDocument();
    expect(setSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
