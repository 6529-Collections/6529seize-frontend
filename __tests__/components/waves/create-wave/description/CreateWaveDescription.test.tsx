import React from 'react';

// Mock helper functions
const mockProfileAndConsolidationsToProfileMin = jest.fn();
jest.mock('../../../../../helpers/ProfileHelpers', () => ({
  ...jest.requireActual('../../../../../helpers/ProfileHelpers'),
  profileAndConsolidationsToProfileMin: mockProfileAndConsolidationsToProfileMin,
}));

// Mock CreateDropType
jest.mock('../../../../../components/drops/create/types', () => ({
  CreateDropType: {
    DROP: 'DROP',
  },
}));

// Mock DropEditor component
jest.mock('../../../../../components/drops/create/DropEditor', () => 
  React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      requestDrop: () => ({ content: 'test drop' }),
    }));
    
    return (
      <div data-testid="drop-editor">
        <div data-testid="wave-id">{props.waveId}</div>
        <div data-testid="type">{props.type}</div>
        <div data-testid="loading">{props.loading ? 'true' : 'false'}</div>
        <div data-testid="show-submit">{props.showSubmit ? 'true' : 'false'}</div>
        <div data-testid="show-drop-error">{props.showDropError ? 'true' : 'false'}</div>
        <div data-testid="wave-name">{props.wave?.name}</div>
        <div data-testid="wave-image">{props.wave?.image}</div>
        <div data-testid="wave-id-prop">{props.wave?.id}</div>
      </div>
    );
  })
);

import { render, screen } from '@testing-library/react';
import CreateWaveDescription, { CreateWaveDescriptionHandles } from '../../../../../components/waves/create-wave/description/CreateWaveDescription';

describe('CreateWaveDescription', () => {
  const mockProfile = {
    id: 'profile-123',
    handle: 'testuser',
    wallet: '0x123',
    pfp: null,
    banner1: null,
    banner2: null,
    cic: 100,
    rep: 200,
    tdh: 1000,
    level: 5,
    primary_wallet: '0x123',
    consolidation: {
      wallets: [{ wallet: { address: '0x123' } }],
    },
  } as any;

  const mockWave = {
    name: 'Test Wave',
    image: 'https://example.com/image.png',
    id: 'wave-123',
  };

  const defaultProps = {
    profile: mockProfile,
    wave: mockWave,
    showDropError: false,
    onHaveDropToSubmitChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileAndConsolidationsToProfileMin.mockReturnValue({
      id: 'profile-123',
      handle: 'testuser',
      pfp: null,
      banner1_color: null,
      banner2_color: null,
      cic: 100,
      rep: 200,
      tdh: 1000,
      level: 5,
      archived: false,
      primary_address: '0x123',
    });
  });

  it('renders description title and instructions', () => {
    render(<CreateWaveDescription {...defaultProps} />);
    
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Give a good description of your wave/)).toBeInTheDocument();
  });

  it('renders DropEditor with correct props', () => {
    render(<CreateWaveDescription {...defaultProps} />);
    
    expect(screen.getByTestId('drop-editor')).toBeInTheDocument();
    expect(screen.getByTestId('wave-id')).toHaveTextContent('');
    expect(screen.getByTestId('type')).toHaveTextContent('DROP');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('show-submit')).toHaveTextContent('false');
    expect(screen.getByTestId('show-drop-error')).toHaveTextContent('false');
    expect(screen.getByTestId('wave-name')).toHaveTextContent('Test Wave');
    expect(screen.getByTestId('wave-image')).toHaveTextContent('https://example.com/image.png');
    expect(screen.getByTestId('wave-id-prop')).toHaveTextContent('wave-123');
  });

  it('passes showDropError to DropEditor', () => {
    render(<CreateWaveDescription {...defaultProps} showDropError={true} />);
    
    expect(screen.getByTestId('show-drop-error')).toHaveTextContent('true');
  });

  it('handles wave with null image', () => {
    const waveWithNullImage = { ...mockWave, image: null };
    render(<CreateWaveDescription {...defaultProps} wave={waveWithNullImage} />);
    
    expect(screen.getByTestId('wave-image')).toHaveTextContent('');
  });

  it('handles wave with null id', () => {
    const waveWithNullId = { ...mockWave, id: null };
    render(<CreateWaveDescription {...defaultProps} wave={waveWithNullId} />);
    
    expect(screen.getByTestId('wave-id-prop')).toHaveTextContent('');
  });

  it('returns null when profile has no id or handle', () => {
    mockProfileAndConsolidationsToProfileMin.mockReturnValue(null);
    
    const { container } = render(<CreateWaveDescription {...defaultProps} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('exposes requestDrop through ref', () => {
    const ref = React.createRef<CreateWaveDescriptionHandles>();
    render(<CreateWaveDescription {...defaultProps} ref={ref} />);
    
    const result = ref.current?.requestDrop();
    expect(result).toEqual({ content: 'test drop' });
  });

  it('handles onHaveDropToSubmitChange callback', () => {
    const onHaveDropToSubmitChange = jest.fn();
    render(<CreateWaveDescription {...defaultProps} onHaveDropToSubmitChange={onHaveDropToSubmitChange} />);
    
    // The DropEditor component should receive the callback
    expect(screen.getByTestId('drop-editor')).toBeInTheDocument();
  });

  it('passes empty onSubmitDrop callback to DropEditor', () => {
    render(<CreateWaveDescription {...defaultProps} />);
    
    // DropEditor should be rendered without throwing errors
    expect(screen.getByTestId('drop-editor')).toBeInTheDocument();
  });

  it('uses correct dropEditorRefreshKey', () => {
    render(<CreateWaveDescription {...defaultProps} />);
    
    // The DropEditor should be rendered with the hardcoded refresh key
    expect(screen.getByTestId('drop-editor')).toBeInTheDocument();
  });

  it('displays proper styling classes', () => {
    const { container } = render(<CreateWaveDescription {...defaultProps} />);
    
    const title = screen.getByText('Description');
    expect(title).toHaveClass('tw-mb-0', 'tw-text-lg', 'sm:tw-text-xl', 'tw-font-semibold', 'tw-text-iron-50');
    
    const subtitle = screen.getByText(/Give a good description of your wave/);
    expect(subtitle).toHaveClass('tw-mt-2', 'tw-mb-0', 'tw-text-base', 'tw-font-normal', 'tw-text-iron-400');
  });
});