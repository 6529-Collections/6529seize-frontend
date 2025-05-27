import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockPickerDateSelect from '../../../components/block-picker/BlockPickerDateSelect';

describe('BlockPickerDateSelect', () => {
  const mockSetDate = jest.fn();
  const mockSetTime = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock showPicker method for date/time inputs in test environment
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      value: jest.fn(),
      writable: true,
    });
  });

  describe('rendering', () => {
    it('renders date and time inputs with labels', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      expect(screen.getByText('Select date')).toBeInTheDocument();
      expect(screen.getByText('Select time')).toBeInTheDocument();
      
      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');
      
      expect(dateInput).toBeInTheDocument();
      expect(timeInput).toBeInTheDocument();
    });

    it('sets correct input attributes', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');

      expect(dateInput).toHaveAttribute('type', 'date');
      expect(dateInput).toHaveAttribute('name', 'block-picker-date');
      expect(dateInput).toHaveAttribute('id', 'block-picker-date');
      expect(dateInput).toHaveAttribute('required');

      expect(timeInput).toHaveAttribute('type', 'time');
      expect(timeInput).toHaveAttribute('name', 'block-picker-time');
      expect(timeInput).toHaveAttribute('id', 'block-picker-time');
      expect(timeInput).toHaveAttribute('step', '1');
      expect(timeInput).toHaveAttribute('required');
    });

    it('applies correct CSS classes', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');

      expect(dateInput).toHaveClass('tw-cursor-pointer');
      expect(timeInput).toHaveClass('tw-cursor-pointer');
      
      expect(dateInput).toHaveClass('tw-form-input');
      expect(timeInput).toHaveClass('tw-form-input');
    });
  });

  describe('date input interactions', () => {
    it('calls setDate when date input changes', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      
      fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

      expect(mockSetDate).toHaveBeenCalledWith('2024-12-25');
    });

    it('calls setDate on direct onChange event', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      
      fireEvent.change(dateInput, { target: { value: '2024-06-01' } });

      expect(mockSetDate).toHaveBeenCalledWith('2024-06-01');
    });

    it('calls showPicker when date input is clicked', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
      const showPickerSpy = jest.spyOn(dateInput, 'showPicker');
      
      fireEvent.click(dateInput);

      expect(showPickerSpy).toHaveBeenCalledTimes(1);
    });

    it('handles empty date value', () => {
      render(
        <BlockPickerDateSelect
          date=""
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('');
      expect(dateInput).toHaveValue('');
    });
  });

  describe('time input interactions', () => {
    it('calls setTime when time input changes', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const timeInput = screen.getByDisplayValue('14:30:45');
      
      fireEvent.change(timeInput, { target: { value: '09:15:30' } });

      expect(mockSetTime).toHaveBeenCalledWith('09:15:30');
    });

    it('calls setTime on direct onChange event', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const timeInput = screen.getByDisplayValue('14:30:45');
      
      fireEvent.change(timeInput, { target: { value: '23:59:59' } });

      expect(mockSetTime).toHaveBeenCalledWith('23:59:59');
    });

    it('calls showPicker when time input is clicked', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const timeInput = screen.getByDisplayValue('14:30:45') as HTMLInputElement;
      const showPickerSpy = jest.spyOn(timeInput, 'showPicker');
      
      fireEvent.click(timeInput);

      expect(showPickerSpy).toHaveBeenCalledTimes(1);
    });

    it('handles empty time value', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time=""
          setTime={mockSetTime}
        />
      );

      const timeInput = document.getElementById('block-picker-time');
      expect(timeInput).toHaveValue('');
    });
  });

  describe('component structure', () => {
    it('has proper layout with flex containers', () => {
      const { container } = render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('tw-gap-x-4', 'tw-flex', 'tw-w-full');

      const dateContainer = screen.getByText('Select date').closest('div.tw-w-full');
      const timeContainer = screen.getByText('Select time').closest('div.tw-w-full');
      
      expect(dateContainer).toBeInTheDocument();
      expect(timeContainer).toBeInTheDocument();
    });

    it('has correct label styling', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateLabel = screen.getByText('Select date');
      const timeLabel = screen.getByText('Select time');

      expect(dateLabel).toHaveClass('tw-block', 'tw-text-sm', 'tw-font-normal');
      expect(timeLabel).toHaveClass('tw-block', 'tw-text-sm', 'tw-font-normal');
    });
  });

  describe('input accessibility', () => {
    it('has inputs with correct IDs', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');

      expect(dateInput).toHaveAttribute('id', 'block-picker-date');
      expect(timeInput).toHaveAttribute('id', 'block-picker-time');
    });

    it('has required attributes for form validation', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');

      expect(dateInput).toBeRequired();
      expect(timeInput).toBeRequired();
    });
  });

  describe('edge cases', () => {
    it('browser sanitizes invalid date values', () => {
      render(
        <BlockPickerDateSelect
          date="invalid-date"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = document.getElementById('block-picker-date');
      // HTML date inputs automatically clear invalid values
      expect(dateInput).toHaveValue('');
    });

    it('browser sanitizes invalid time values', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="invalid-time"
          setTime={mockSetTime}
        />
      );

      const timeInput = document.getElementById('block-picker-time');
      // HTML time inputs automatically clear invalid values
      expect(timeInput).toHaveValue('');
    });

    it('works without showPicker method available', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15') as HTMLInputElement;
      delete (dateInput as any).showPicker;
      
      // Should not throw when showPicker is not available
      expect(() => fireEvent.click(dateInput)).not.toThrow();
    });

    it('handles rapid input changes', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      
      // Rapid changes
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(dateInput, { target: { value: '2024-02-01' } });
      fireEvent.change(dateInput, { target: { value: '2024-03-01' } });

      expect(mockSetDate).toHaveBeenCalledTimes(3);
      expect(mockSetDate).toHaveBeenLastCalledWith('2024-03-01');
    });
  });

  describe('styling consistency', () => {
    it('applies consistent styling classes to both inputs', () => {
      render(
        <BlockPickerDateSelect
          date="2024-01-15"
          setDate={mockSetDate}
          time="14:30:45"
          setTime={mockSetTime}
        />
      );

      const dateInput = screen.getByDisplayValue('2024-01-15');
      const timeInput = screen.getByDisplayValue('14:30:45');

      // Both should have the same base styling classes
      const expectedClasses = [
        'tw-cursor-pointer',
        'tw-form-input',
        'tw-block',
        'tw-w-full',
        'tw-rounded-lg',
        'tw-border-0'
      ];

      expectedClasses.forEach(className => {
        expect(dateInput).toHaveClass(className);
        expect(timeInput).toHaveClass(className);
      });
    });
  });

  describe('basic functionality', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <BlockPickerDateSelect
            date="2024-01-15"
            setDate={mockSetDate}
            time="14:30:45"
            setTime={mockSetTime}
          />
        );
      }).not.toThrow();
    });

    it('displays provided values correctly', () => {
      render(
        <BlockPickerDateSelect
          date="2023-12-31"
          setDate={mockSetDate}
          time="23:59:59"
          setTime={mockSetTime}
        />
      );

      expect(screen.getByDisplayValue('2023-12-31')).toBeInTheDocument();
      expect(screen.getByDisplayValue('23:59:59')).toBeInTheDocument();
    });
  });
});
