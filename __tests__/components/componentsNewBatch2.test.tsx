import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentRandomHoldersWeightItem from '../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeightItem';
import { ComponentRandomHoldersWeightType } from '../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight';

describe('ComponentRandomHoldersWeightItem Tests', () => {
  describe('Basic Rendering', () => {
    const mockItem = {
      itemType: ComponentRandomHoldersWeightType.OFF,
      name: 'Off',
    };

    it('renders with correct props when active', () => {
      const onChange = jest.fn();
      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.OFF}
          onChange={onChange}
        />
      );

      const radio = screen.getByRole('radio') as HTMLInputElement;
      expect(radio.checked).toBe(true);
      expect(screen.getByText('Off')).toBeTruthy();
    });

    it('renders with correct props when inactive', () => {
      const onChange = jest.fn();
      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.TOTAL_CARDS}
          onChange={onChange}
        />
      );

      const radio = screen.getByRole('radio') as HTMLInputElement;
      expect(radio.checked).toBe(false);
      expect(screen.getByText('Off')).toBeTruthy();
    });

    it('calls onChange when radio is clicked', () => {
      const onChange = jest.fn();
      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.TOTAL_CARDS}
          onChange={onChange}
        />
      );

      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      expect(onChange).toHaveBeenCalledWith(ComponentRandomHoldersWeightType.OFF);
    });

    it('calls onChange when label is clicked', () => {
      const onChange = jest.fn();
      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.TOTAL_CARDS}
          onChange={onChange}
        />
      );

      const label = screen.getByText('Off');
      fireEvent.click(label);
      expect(onChange).toHaveBeenCalledWith(ComponentRandomHoldersWeightType.OFF);
    });
  });

  describe('State Updates', () => {
    it('updates checked state when activeType changes', () => {
      const onChange = jest.fn();
      const mockItem = {
        itemType: ComponentRandomHoldersWeightType.OFF,
        name: 'Off',
      };

      const { rerender } = render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.TOTAL_CARDS}
          onChange={onChange}
        />
      );

      expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(false);

      rerender(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.OFF}
          onChange={onChange}
        />
      );

      expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('Different Weight Types', () => {
    const testCases = [
      {
        itemType: ComponentRandomHoldersWeightType.OFF,
        name: 'Off',
      },
      {
        itemType: ComponentRandomHoldersWeightType.TOTAL_CARDS,
        name: 'Total Cards',
      },
      {
        itemType: ComponentRandomHoldersWeightType.UNIQUE_CARDS,
        name: 'Unique Cards',
      },
    ];

    testCases.forEach(({ itemType, name }) => {
      it(`renders correctly for ${itemType} type`, () => {
        const onChange = jest.fn();
        const mockItem = { itemType, name };

        render(
          <ComponentRandomHoldersWeightItem
            item={mockItem}
            activeType={itemType}
            onChange={onChange}
          />
        );

        expect((screen.getByRole('radio') as HTMLInputElement).checked).toBe(true);
        expect(screen.getByText(name)).toBeTruthy();
      });

      it(`generates correct htmlFor id for ${itemType}`, () => {
        const onChange = jest.fn();
        const mockItem = { itemType, name };

        render(
          <ComponentRandomHoldersWeightItem
            item={mockItem}
            activeType={itemType}
            onChange={onChange}
          />
        );

        const radio = screen.getByRole('radio');
        const expectedId = `random-holders-weight-${itemType}`;
        expect(radio.getAttribute('id')).toBe(expectedId);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      const onChange = jest.fn();
      const mockItem = {
        itemType: ComponentRandomHoldersWeightType.OFF,
        name: 'Test Label',
      };

      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.OFF}
          onChange={onChange}
        />
      );

      const radio = screen.getByRole('radio');
      const label = screen.getByText('Test Label');
      const expectedId = 'random-holders-weight-OFF';
      
      expect(radio).toBeTruthy();
      expect(label).toBeTruthy();
      expect(radio.getAttribute('id')).toBe(expectedId);
      expect(radio.getAttribute('name')).toBe(expectedId);
    });

    it('associates label with radio input correctly', () => {
      const onChange = jest.fn();
      const mockItem = {
        itemType: ComponentRandomHoldersWeightType.TOTAL_CARDS,
        name: 'Total Cards Label',
      };

      render(
        <ComponentRandomHoldersWeightItem
          item={mockItem}
          activeType={ComponentRandomHoldersWeightType.TOTAL_CARDS}
          onChange={onChange}
        />
      );

      const radio = screen.getByRole('radio');
      const label = screen.getByText('Total Cards Label');
      const radioId = radio.getAttribute('id');
      const labelFor = label.getAttribute('for');
      
      expect(radioId).toBe(labelFor);
    });
  });

  describe('Error Handling', () => {
    it('handles missing itemType gracefully', () => {
      const onChange = jest.fn();
      const mockItem = {
        itemType: undefined as any,
        name: 'Test',
      };

      expect(() => {
        render(
          <ComponentRandomHoldersWeightItem
            item={mockItem}
            activeType={ComponentRandomHoldersWeightType.OFF}
            onChange={onChange}
          />
        );
      }).not.toThrow();
    });

    it('handles missing name gracefully', () => {
      const onChange = jest.fn();
      const mockItem = {
        itemType: ComponentRandomHoldersWeightType.OFF,
        name: '',
      };

      expect(() => {
        render(
          <ComponentRandomHoldersWeightItem
            item={mockItem}
            activeType={ComponentRandomHoldersWeightType.OFF}
            onChange={onChange}
          />
        );
      }).not.toThrow();
    });
  });
});