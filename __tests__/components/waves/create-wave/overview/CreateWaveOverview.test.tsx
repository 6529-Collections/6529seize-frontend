import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateWaveOverview from '../../../../../components/waves/create-wave/overview/CreateWaveOverview';
import { CREATE_WAVE_VALIDATION_ERROR } from '../../../../../helpers/waves/create-wave.validation';
import { WaveOverviewConfig } from '../../../../../types/waves.types';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';

// Mock the child components
jest.mock('../../../../../components/waves/create-wave/overview/CreateWaveNameInput', () => {
  return function MockCreateWaveNameInput({ onChange, name, errors }: any) {
    return (
      <div data-testid="wave-name-input">
        <input
          data-testid="name-input"
          value={name || ''}
          onChange={(e) => onChange({ key: 'name', value: e.target.value })}
          placeholder="Wave name"
        />
        {errors.length > 0 && <div data-testid="name-errors">Errors: {errors.length}</div>}
      </div>
    );
  };
});

jest.mock('../../../../../components/waves/create-wave/overview/CreateWaveImageInput', () => {
  return function MockCreateWaveImageInput({ imageToShow, setFile }: any) {
    return (
      <div data-testid="wave-image-input">
        <button 
          data-testid="set-image-button"
          onClick={() => setFile(new File(['test'], 'test.png', { type: 'image/png' }))}
        >
          Set Image
        </button>
        {imageToShow && <div data-testid="current-image">Image: {imageToShow.name}</div>}
      </div>
    );
  };
});

jest.mock('../../../../../components/waves/create-wave/overview/type/CreateWaveType', () => {
  return function MockCreateWaveType({ selected, onChange }: any) {
    return (
      <div data-testid="wave-type-input">
        <select
          data-testid="type-select"
          value={selected || ''}
          onChange={(e) => onChange(e.target.value as ApiWaveType)}
        >
          <option value="">Select type</option>
          <option value="CHAT">Chat</option>
          <option value="APPROVE">Approve</option>
          <option value="RANK">Rank</option>
        </select>
        <div data-testid="current-type">Current: {selected || 'none'}</div>
      </div>
    );
  };
});

describe('CreateWaveOverview', () => {
  const mockOverview: WaveOverviewConfig = {
    name: '',
    image: null,
    type: null,
  };

  const mockSetOverview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all child components correctly', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    expect(screen.getByTestId('wave-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('wave-image-input')).toBeInTheDocument();
    expect(screen.getByTestId('wave-type-input')).toBeInTheDocument();
  });

  it('displays Wave Profile Picture header', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    expect(screen.getByText('Wave Profile Picture')).toBeInTheDocument();
  });

  it('passes current overview values to child components', () => {
    const overviewWithValues: WaveOverviewConfig = {
      name: 'Test Wave',
      image: new File(['test'], 'test.png', { type: 'image/png' }),
      type: ApiWaveType.Chat,
    };

    render(
      <CreateWaveOverview
        overview={overviewWithValues}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    expect(screen.getByDisplayValue('Test Wave')).toBeInTheDocument();
    expect(screen.getByText('Image: test.png')).toBeInTheDocument();
    expect(screen.getByText('Current: CHAT')).toBeInTheDocument();
  });

  it('passes errors to name input component', () => {
    const errors = [CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED];

    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={errors}
        setOverview={mockSetOverview}
      />
    );

    expect(screen.getByTestId('name-errors')).toBeInTheDocument();
    expect(screen.getByText('Errors: 1')).toBeInTheDocument();
  });

  it('handles name input changes correctly', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'New Wave Name' } });

    expect(mockSetOverview).toHaveBeenCalledWith({
      ...mockOverview,
      name: 'New Wave Name',
    });
  });

  it('handles image input changes correctly', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    const setImageButton = screen.getByTestId('set-image-button');
    fireEvent.click(setImageButton);

    expect(mockSetOverview).toHaveBeenCalledWith({
      ...mockOverview,
      image: expect.any(File),
    });
  });

  it('handles type selection changes correctly', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    const typeSelect = screen.getByTestId('type-select');
    fireEvent.change(typeSelect, { target: { value: 'APPROVE' } });

    expect(mockSetOverview).toHaveBeenCalledWith({
      ...mockOverview,
      type: 'APPROVE',
    });
  });

  it('preserves existing overview values when updating specific fields', () => {
    const existingOverview: WaveOverviewConfig = {
      name: 'Existing Wave',
      image: new File(['existing'], 'existing.png', { type: 'image/png' }),
      type: ApiWaveType.Chat,
    };

    render(
      <CreateWaveOverview
        overview={existingOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    // Change only the name
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Updated Wave' } });

    expect(mockSetOverview).toHaveBeenCalledWith({
      ...existingOverview,
      name: 'Updated Wave',
    });
  });

  it('handles multiple validation errors', () => {
    const multipleErrors = [
      CREATE_WAVE_VALIDATION_ERROR.NAME_REQUIRED,
      CREATE_WAVE_VALIDATION_ERROR.NAME_TOO_LONG,
    ];

    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={multipleErrors}
        setOverview={mockSetOverview}
      />
    );

    expect(screen.getByText('Errors: 2')).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    const { container } = render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('tw-flex', 'tw-flex-col', 'tw-space-y-6');
  });

  it('applies correct CSS classes for profile picture section', () => {
    render(
      <CreateWaveOverview
        overview={mockOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    const profilePictureSection = screen.getByText('Wave Profile Picture').parentElement;
    expect(profilePictureSection).toHaveClass('tw-space-y-2');
  });

  it('handles edge case with null overview values', () => {
    const nullOverview: WaveOverviewConfig = {
      name: null as any,
      image: null,
      type: null,
    };

    render(
      <CreateWaveOverview
        overview={nullOverview}
        errors={[]}
        setOverview={mockSetOverview}
      />
    );

    // Should render without crashing
    expect(screen.getByTestId('wave-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('wave-image-input')).toBeInTheDocument();
    expect(screen.getByTestId('wave-type-input')).toBeInTheDocument();
  });
});