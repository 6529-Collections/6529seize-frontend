import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateWavesMainStepIcon from '@/components/waves/create-wave/main-steps/CreateWavesMainStepIcon';
import { CreateWaveStepStatus } from '@/types/waves.types';

// Mock react-use debounce
jest.mock('react-use', () => ({
  useDebounce: jest.fn(() => {
    // No-op for testing to avoid infinite renders
  }),
}));

describe('CreateWavesMainStepIcon', () => {
  const renderComponent = (stepStatus: CreateWaveStepStatus) => {
    return render(<CreateWavesMainStepIcon stepStatus={stepStatus} />);
  };

  it('renders DONE status with checkmark icon', () => {
    renderComponent(CreateWaveStepStatus.DONE);
    
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass(
      'tw-ring-primary-500',
      'tw-bg-primary-600',
      'tw-delay-0'
    );
    
    // Check for checkmark SVG
    const svg = icon.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '13');
    expect(svg).toHaveAttribute('height', '11');
  });

  it('renders ACTIVE status with circle icon and shadow', () => {
    renderComponent(CreateWaveStepStatus.ACTIVE);
    
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass(
      'tw-ring-primary-500',
      'tw-bg-primary-600',
      'tw-delay-500'
    );
    
    // Check for circle SVG
    const svg = icon.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '8');
    expect(svg).toHaveAttribute('height', '8');
    
    const circle = svg?.querySelector('circle');
    expect(circle).toHaveAttribute('fill', 'white');
  });

  it('renders PENDING status with gray circle icon', () => {
    renderComponent(CreateWaveStepStatus.PENDING);
    
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass(
      'tw-ring-iron-700',
      'tw-bg-iron-900',
      'tw-delay-0'
    );
    
    // Check for circle SVG
    const svg = icon.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('tw-text-iron-500');
    expect(svg).toHaveAttribute('width', '8');
    expect(svg).toHaveAttribute('height', '8');
    
    const circle = svg?.querySelector('circle');
    expect(circle).toHaveAttribute('fill', 'currentColor');
  });

  it('applies common wrapper classes for all statuses', () => {
    renderComponent(CreateWaveStepStatus.DONE);
    
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass(
      'tw-relative',
      'tw-z-10',
      'tw-flex',
      'tw-h-7',
      'tw-w-7',
      'tw-items-center',
      'tw-justify-center',
      'tw-rounded-full',
      'tw-ring-2',
      'tw-transform',
      'tw-transition',
      'tw-ease-out',
      'tw-duration-300'
    );
  });

  it('handles debounced state updates for ACTIVE status', () => {
    const { rerender } = renderComponent(CreateWaveStepStatus.PENDING);
    
    // Change to ACTIVE status
    rerender(<CreateWavesMainStepIcon stepStatus={CreateWaveStepStatus.ACTIVE} />);
    
    // The wrapper should have ACTIVE classes applied
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass('tw-delay-500');
  });

  it('immediately updates for non-ACTIVE status changes', () => {
    const { rerender } = renderComponent(CreateWaveStepStatus.ACTIVE);
    
    // Change to DONE status
    rerender(<CreateWavesMainStepIcon stepStatus={CreateWaveStepStatus.DONE} />);
    
    // Should immediately have DONE classes
    const icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass('tw-delay-0');
  });

  it('maintains proper SVG structure for checkmark icon', () => {
    renderComponent(CreateWaveStepStatus.DONE);
    
    const svg = screen.getByTestId('wave-step-icon').querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 13 11');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill-rule', 'evenodd');
    expect(path).toHaveAttribute('clip-rule', 'evenodd');
    expect(path).toHaveAttribute('fill', 'currentColor');
  });

  it('maintains proper SVG structure for circle icons', () => {
    renderComponent(CreateWaveStepStatus.ACTIVE);
    
    const svg = screen.getByTestId('wave-step-icon').querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 8 8');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const circle = svg?.querySelector('circle');
    expect(circle).toHaveAttribute('cx', '4');
    expect(circle).toHaveAttribute('cy', '4');
    expect(circle).toHaveAttribute('r', '4');
  });

  it('renders different icons for each status', () => {
    // Test DONE status
    const { unmount: unmountDone } = renderComponent(CreateWaveStepStatus.DONE);
    let svg = screen.getByTestId('wave-step-icon').querySelector('svg');
    expect(svg).toHaveAttribute('width', '13');
    expect(svg).toHaveAttribute('height', '11');
    expect(svg?.querySelector('path')).toBeInTheDocument();
    unmountDone();
    
    // Test ACTIVE status
    const { unmount: unmountActive } = renderComponent(CreateWaveStepStatus.ACTIVE);
    svg = screen.getByTestId('wave-step-icon').querySelector('svg');
    expect(svg).toHaveAttribute('width', '8');
    expect(svg).toHaveAttribute('height', '8');
    expect(svg?.querySelector('circle')).toHaveAttribute('fill', 'white');
    unmountActive();
    
    // Test PENDING status
    renderComponent(CreateWaveStepStatus.PENDING);
    svg = screen.getByTestId('wave-step-icon').querySelector('svg');
    expect(svg).toHaveAttribute('width', '8');
    expect(svg).toHaveAttribute('height', '8');
    expect(svg?.querySelector('circle')).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveClass('tw-text-iron-500');
  });

  it('applies correct background colors for each status', () => {
    const { rerender } = renderComponent(CreateWaveStepStatus.DONE);
    
    // DONE - primary colors
    let icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass('tw-bg-primary-600', 'tw-ring-primary-500');
    
    // ACTIVE - primary colors with shadow
    rerender(<CreateWavesMainStepIcon stepStatus={CreateWaveStepStatus.ACTIVE} />);
    icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass('tw-bg-primary-600', 'tw-ring-primary-500');
    
    // PENDING - iron colors
    rerender(<CreateWavesMainStepIcon stepStatus={CreateWaveStepStatus.PENDING} />);
    icon = screen.getByTestId('wave-step-icon');
    expect(icon).toHaveClass('tw-bg-iron-900', 'tw-ring-iron-700');
  });
});