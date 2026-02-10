import { render, screen, fireEvent } from '@testing-library/react';
import WavesListSearch from '@/components/waves/list/header/WavesListSearch';

// Create enum first for both mock and real use
enum IdentitySearchSize {
  SM = 'SM',
  MD = 'MD',
}

// Mock IdentitySearch component
jest.mock('@/components/utils/input/identity/IdentitySearch', () => {
  const MockIdentitySearch = ({ identity, setIdentity, label, size }: any) => (
    <div data-testid="identity-search">
      <input
        data-testid="identity-input"
        value={identity || ''}
        onChange={(e) => setIdentity(e.target.value || null)}
        placeholder={label}
      />
      <div data-testid="identity-size">{size}</div>
    </div>
  );

  return {
    __esModule: true,
    default: MockIdentitySearch,
    IdentitySearchSize: {
      SM: 'SM',
      MD: 'MD',
    },
  };
});

describe('WavesListSearch', () => {
  const defaultProps = {
    identity: null,
    waveName: null,
    setIdentity: jest.fn(),
    setWaveName: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wave name search input', () => {
    render(<WavesListSearch {...defaultProps} />);
    
    expect(screen.getByLabelText('Search waves')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search waves' })).toBeInTheDocument();
  });

  it('renders identity search component', () => {
    render(<WavesListSearch {...defaultProps} />);
    
    expect(screen.getByTestId('identity-search')).toBeInTheDocument();
    expect(screen.getByTestId('identity-input')).toBeInTheDocument();
  });

  it('passes correct props to IdentitySearch', () => {
    render(<WavesListSearch {...defaultProps} identity="test-identity" />);
    
    expect(screen.getByTestId('identity-input')).toHaveValue('test-identity');
    expect(screen.getByTestId('identity-size')).toHaveTextContent('SM');
    expect(screen.getByPlaceholderText('By Identity')).toBeInTheDocument();
  });

  it('displays current wave name value', () => {
    render(<WavesListSearch {...defaultProps} waveName="test wave" />);
    
    const input = screen.getByRole('textbox', { name: 'Search waves' });
    expect(input).toHaveValue('test wave');
  });

  it('displays empty string when waveName is null', () => {
    render(<WavesListSearch {...defaultProps} waveName={null} />);
    
    const input = screen.getByRole('textbox', { name: 'Search waves' });
    expect(input).toHaveValue('');
  });

  it('calls setWaveName when wave search input changes', () => {
    const setWaveName = jest.fn();
    render(<WavesListSearch {...defaultProps} setWaveName={setWaveName} />);
    
    const input = screen.getByRole('textbox', { name: 'Search waves' });
    fireEvent.change(input, { target: { value: 'new wave name' } });
    
    expect(setWaveName).toHaveBeenCalledWith('new wave name');
  });

  it('calls setIdentity when identity search changes', () => {
    const setIdentity = jest.fn();
    render(<WavesListSearch {...defaultProps} setIdentity={setIdentity} />);
    
    const identityInput = screen.getByTestId('identity-input');
    fireEvent.change(identityInput, { target: { value: 'new identity' } });
    
    expect(setIdentity).toHaveBeenCalledWith('new identity');
  });

  it('shows clear button when waveName has value', () => {
    render(<WavesListSearch {...defaultProps} waveName="test wave" />);
    
    // The clear button is an SVG with onClick, so we can find it by its aria-hidden attribute and cursor class
    const clearButton = document.querySelector('svg.tw-cursor-pointer');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when waveName is null', () => {
    render(<WavesListSearch {...defaultProps} waveName={null} />);
    
    const clearButton = document.querySelector('svg.tw-cursor-pointer');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('calls setWaveName with null when clear button is clicked', () => {
    const setWaveName = jest.fn();
    render(<WavesListSearch {...defaultProps} waveName="test wave" setWaveName={setWaveName} />);
    
    const clearButton = document.querySelector('svg.tw-cursor-pointer');
    fireEvent.click(clearButton!);
    
    expect(setWaveName).toHaveBeenCalledWith(null);
  });

  it('has proper accessibility attributes', () => {
    render(<WavesListSearch {...defaultProps} />);
    
    const searchInput = screen.getByRole('textbox', { name: 'Search waves' });
    expect(searchInput).toHaveAttribute('id', 'search-waves');
    
    const label = screen.getByLabelText('Search waves');
    expect(label).toBeInTheDocument();
    
    const searchIcon = document.querySelector('svg[aria-hidden="true"]');
    expect(searchIcon).toBeTruthy();
    expect(searchIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has correct styling classes', () => {
    render(<WavesListSearch {...defaultProps} />);
    
    const container = screen.getByRole('textbox', { name: 'Search waves' }).closest('.tw-flex-1');
    expect(container).toBeInTheDocument();
    
    const mainContainer = container?.closest('.tw-flex');
    expect(mainContainer).toHaveClass('tw-flex', 'tw-flex-col', 'tw-w-full');
  });

  it('handles empty string input correctly', () => {
    const setWaveName = jest.fn();
    render(<WavesListSearch {...defaultProps} waveName="test" setWaveName={setWaveName} />);
    
    const input = screen.getByRole('textbox', { name: 'Search waves' });
    fireEvent.change(input, { target: { value: '' } });
    
    expect(setWaveName).toHaveBeenCalledWith('');
  });
});