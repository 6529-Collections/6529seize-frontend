import { render } from '@testing-library/react';
import BrainDesktopDrop from '../../../components/brain/BrainDesktopDrop';

const mockSingleWaveDrop = jest.fn<any, any[]>(() => <div data-testid="single-drop" />);

jest.mock('../../../components/waves/drop/SingleWaveDrop', () => ({
  SingleWaveDrop: (props: any) => mockSingleWaveDrop(props)
}));

describe('BrainDesktopDrop', () => {
  const drop = { wave: { id: '1' } } as any;
  const onClose = jest.fn();

  beforeEach(() => {
    mockSingleWaveDrop.mockClear();
  });

  it('renders SingleWaveDrop with provided props', () => {
    render(<BrainDesktopDrop drop={drop} onClose={onClose} />);
    expect(mockSingleWaveDrop).toHaveBeenCalledWith({ drop, onClose });
  });
});
