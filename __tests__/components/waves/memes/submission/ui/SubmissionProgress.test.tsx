import React from 'react';
import { render, screen } from '@testing-library/react';
import SubmissionProgress, { SubmissionPhase } from '@/components/waves/memes/submission/ui/SubmissionProgress';

describe('SubmissionProgress', () => {
  const defaultProps = {
    phase: 'uploading' as SubmissionPhase,
    progress: 50,
  };

  it('does not render in idle state', () => {
    const { container } = render(
      <SubmissionProgress {...defaultProps} phase="idle" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders uploading state with file info', () => {
    const fileInfo = { name: 'test.jpg', size: 1048576 };
    render(
      <SubmissionProgress 
        {...defaultProps} 
        phase="uploading" 
        fileInfo={fileInfo} 
        progress={25}
      />
    );

    expect(screen.getByText('Uploading test.jpg (1.0 MB)')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByTestId('submission-progress')).toBeInTheDocument();
  });

  it('renders uploading state without file info', () => {
    render(
      <SubmissionProgress {...defaultProps} phase="uploading" progress={75} />
    );

    expect(screen.getByText('Uploading artwork...')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders signing state', () => {
    render(
      <SubmissionProgress {...defaultProps} phase="signing" />
    );

    expect(screen.getByText('Signing submission...')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('renders processing state', () => {
    render(
      <SubmissionProgress {...defaultProps} phase="processing" />
    );

    expect(screen.getByText('Processing submission...')).toBeInTheDocument();
  });

  it('renders success state', () => {
    render(
      <SubmissionProgress {...defaultProps} phase="success" />
    );

    expect(screen.getByText('Submission complete!')).toBeInTheDocument();
  });

  it('renders error state with custom error message', () => {
    render(
      <SubmissionProgress 
        {...defaultProps} 
        phase="error" 
        error="Upload failed: Network error"
      />
    );

    expect(screen.getByText('Upload failed: Network error')).toBeInTheDocument();
  });

  it('renders error state with default error message', () => {
    render(
      <SubmissionProgress {...defaultProps} phase="error" />
    );

    expect(screen.getByText('Submission failed')).toBeInTheDocument();
  });

  it('formats file sizes correctly', () => {
    const testCases = [
      { size: 500, expected: 'Uploading test.txt (500 bytes)' },
      { size: 1536, expected: 'Uploading test.txt (1.5 KB)' },
      { size: 2097152, expected: 'Uploading test.txt (2.0 MB)' },
    ];

    testCases.forEach(({ size, expected }) => {
      const { unmount } = render(
        <SubmissionProgress 
          {...defaultProps} 
          phase="uploading" 
          fileInfo={{ name: 'test.txt', size }}
        />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies correct progress bar colors for each phase', () => {
    const phases: SubmissionPhase[] = ['uploading', 'signing', 'processing', 'success', 'error'];
    const expectedColors = ['tw-bg-blue-500', 'tw-bg-yellow-500', 'tw-bg-purple-500', 'tw-bg-green-500', 'tw-bg-red-500'];

    phases.forEach((phase, index) => {
      const { container, rerender } = render(
        <SubmissionProgress {...defaultProps} phase={phase} />
      );
      
      const progressBar = container.querySelector('div[style*="width"]');
      expect(progressBar).toHaveClass(expectedColors[index]);
      
      rerender(<div />);
    });
  });

  it('calculates progress width correctly for different phases', () => {
    const testCases = [
      { phase: 'uploading', progress: 30, expected: '30%' },
      { phase: 'signing', progress: 50, expected: '75%' },
      { phase: 'processing', progress: 80, expected: '90%' },
      { phase: 'success', progress: 100, expected: '100%' },
      { phase: 'error', progress: 0, expected: '100%' },
    ];

    testCases.forEach(({ phase, progress, expected }) => {
      const { container, rerender } = render(
        <SubmissionProgress 
          {...defaultProps} 
          phase={phase as SubmissionPhase} 
          progress={progress}
        />
      );
      
      const progressBar = container.querySelector('div[style*="width"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar?.getAttribute('style')).toContain(`width: ${expected}`);
      
      rerender(<div />);
    });
  });

  it('clamps progress values within valid range', () => {
    const { container, rerender } = render(
      <SubmissionProgress {...defaultProps} phase="uploading" progress={-10} />
    );
    
    let progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar?.getAttribute('style')).toContain('width: 0%');

    rerender(
      <SubmissionProgress {...defaultProps} phase="uploading" progress={150} />
    );
    
    progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar?.getAttribute('style')).toContain('width: 100%');
  });

  it('is memoized and does not re-render unnecessarily', () => {
    const MemoizedComponent = React.memo(SubmissionProgress);
    const renderSpy = jest.fn(() => <div>test</div>);
    
    const TestWrapper = React.memo(renderSpy);
    
    const { rerender } = render(
      <div>
        <MemoizedComponent {...defaultProps} />
        <TestWrapper />
      </div>
    );

    rerender(
      <div>
        <MemoizedComponent {...defaultProps} />
        <TestWrapper />
      </div>
    );

    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});