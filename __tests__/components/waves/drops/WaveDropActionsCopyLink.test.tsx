import { render, fireEvent } from '@testing-library/react';
import WaveDropActionsCopyLink from '../../../../components/waves/drops/WaveDropActionsCopyLink';
import '@testing-library/jest-dom';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

const writeText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

describe('WaveDropActionsCopyLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_ENDPOINT = 'https://base';
  });

  it('copies drop link when clicked', () => {
    const drop: any = { id: 'd1', wave: { id: 'w1' }, serial_no: 5 };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    fireEvent.click(getByRole('button'));
    expect(writeText).toHaveBeenCalledWith('https://base/my-stream?wave=w1&serialNo=5');
  });

  it('disables button for temporary drop', () => {
    const drop: any = { id: 'temp-1', wave: { id: 'w1' }, serial_no: 1 };
    const { getByRole } = render(<WaveDropActionsCopyLink drop={drop} />);
    expect(getByRole('button')).toBeDisabled();
    fireEvent.click(getByRole('button'));
    expect(writeText).not.toHaveBeenCalled();
  });
});
