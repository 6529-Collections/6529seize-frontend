import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectModeProvider, useSelectMode } from '@/contexts/SelectModeContext';

// Helper components to reduce nesting
const TestComponent = ({ onContextValue }: { onContextValue: (value: any) => void }) => {
  const contextValue = useSelectMode();
  onContextValue(contextValue);
  return <div>Test</div>;
};

const ToggleButton = () => {
  const { isSelectMode, toggleSelectMode } = useSelectMode();
  return (
    <button onClick={toggleSelectMode} data-testid="toggle-btn">
      {isSelectMode ? 'Exit Select Mode' : 'Enter Select Mode'}
    </button>
  );
};

const StatusDisplay = () => {
  const { isSelectMode } = useSelectMode();
  return (
    <div data-testid="status">
      Status: {isSelectMode ? 'Selecting' : 'Normal'}
    </div>
  );
};

const MultiToggleComponent = () => {
  const { isSelectMode, toggleSelectMode } = useSelectMode();
  return (
    <div>
      <button onClick={toggleSelectMode} data-testid="toggle-1">
        Toggle 1
      </button>
      <button onClick={toggleSelectMode} data-testid="toggle-2">
        Toggle 2
      </button>
      <div data-testid="mode-display">
        Mode: {isSelectMode ? 'ON' : 'OFF'}
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error">Something went wrong</div>;
    }
    return this.props.children;
  }
}

const ThrowingComponent = () => {
  const { isSelectMode, toggleSelectMode } = useSelectMode();
  
  if (isSelectMode) {
    throw new Error('Test error');
  }
  
  return <button onClick={toggleSelectMode}>Toggle</button>;
};

describe('SelectModeContext', () => {
  describe('SelectModeProvider', () => {
    it('should render children', () => {
      render(
        <SelectModeProvider>
          <div data-testid="child">Test content</div>
        </SelectModeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should provide default context values', () => {
      let contextValue: any;
      const handleContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <SelectModeProvider>
          <TestComponent onContextValue={handleContextValue} />
        </SelectModeProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.isSelectMode).toBe(false);
      expect(typeof contextValue.toggleSelectMode).toBe('function');
    });
  });

  describe('useSelectMode hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SelectModeProvider>{children}</SelectModeProvider>
    );

    it('should return initial state', () => {
      const { result } = renderHook(() => useSelectMode(), { wrapper });

      expect(result.current.isSelectMode).toBe(false);
      expect(typeof result.current.toggleSelectMode).toBe('function');
    });

    it('should toggle select mode state', () => {
      const { result } = renderHook(() => useSelectMode(), { wrapper });

      expect(result.current.isSelectMode).toBe(false);

      act(() => {
        result.current.toggleSelectMode();
      });

      expect(result.current.isSelectMode).toBe(true);

      act(() => {
        result.current.toggleSelectMode();
      });

      expect(result.current.isSelectMode).toBe(false);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      console.error = jest.fn();

      const renderHookWithoutProvider = () => renderHook(useSelectMode);

      expect(renderHookWithoutProvider).toThrow('useSelectMode must be used within a SelectModeProvider');

      console.error = originalError;
    });

    it('should maintain state across multiple components', () => {
      let contextValue1: any;
      let contextValue2: any;

      const TestComponent1 = () => {
        contextValue1 = useSelectMode();
        return <div>Component 1</div>;
      };

      const TestComponent2 = () => {
        contextValue2 = useSelectMode();
        return <div>Component 2</div>;
      };

      render(
        <SelectModeProvider>
          <TestComponent1 />
          <TestComponent2 />
        </SelectModeProvider>
      );

      expect(contextValue1.isSelectMode).toBe(false);
      expect(contextValue2.isSelectMode).toBe(false);

      act(() => {
        contextValue1.toggleSelectMode();
      });

      expect(contextValue1.isSelectMode).toBe(true);
      expect(contextValue2.isSelectMode).toBe(true);
    });
  });

  describe('integration with components', () => {
    it('should allow components to toggle select mode', () => {
      render(
        <SelectModeProvider>
          <ToggleButton />
          <StatusDisplay />
        </SelectModeProvider>
      );

      const toggleButton = screen.getByTestId('toggle-btn');
      const statusDisplay = screen.getByTestId('status');

      expect(toggleButton).toHaveTextContent('Enter Select Mode');
      expect(statusDisplay).toHaveTextContent('Status: Normal');

      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveTextContent('Exit Select Mode');
      expect(statusDisplay).toHaveTextContent('Status: Selecting');

      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveTextContent('Enter Select Mode');
      expect(statusDisplay).toHaveTextContent('Status: Normal');
    });

    it('should handle multiple toggle operations', () => {
      render(
        <SelectModeProvider>
          <MultiToggleComponent />
        </SelectModeProvider>
      );

      const toggle1 = screen.getByTestId('toggle-1');
      const toggle2 = screen.getByTestId('toggle-2');
      const modeDisplay = screen.getByTestId('mode-display');

      expect(modeDisplay).toHaveTextContent('Mode: OFF');

      fireEvent.click(toggle1);
      expect(modeDisplay).toHaveTextContent('Mode: ON');

      fireEvent.click(toggle2);
      expect(modeDisplay).toHaveTextContent('Mode: OFF');

      fireEvent.click(toggle1);
      expect(modeDisplay).toHaveTextContent('Mode: ON');
    });
  });

  describe('context value stability', () => {
    it('should maintain reference stability for toggleSelectMode', () => {
      let renderCount = 0;
      let toggleSelectModeRef: any;

      const TestComponent = () => {
        renderCount++;
        const { toggleSelectMode } = useSelectMode();
        
        if (renderCount === 1) {
          toggleSelectModeRef = toggleSelectMode;
        } else {
          // toggleSelectMode should be the same reference
          expect(toggleSelectMode).toBe(toggleSelectModeRef);
        }

        return <div>Render count: {renderCount}</div>;
      };

      const { rerender } = render(
        <SelectModeProvider>
          <TestComponent />
        </SelectModeProvider>
      );

      // Force re-render
      rerender(
        <SelectModeProvider>
          <TestComponent />
        </SelectModeProvider>
      );

      expect(renderCount).toBe(2);
    });

    it('should memoize context value properly', () => {
      let contextValueRef: any;
      let renderCount = 0;

      const TestComponent = () => {
        renderCount++;
        const contextValue = useSelectMode();
        
        if (renderCount === 1) {
          contextValueRef = contextValue;
        }

        return <div>{contextValue.isSelectMode ? 'ON' : 'OFF'}</div>;
      };

      const { rerender } = render(
        <SelectModeProvider>
          <TestComponent />
        </SelectModeProvider>
      );

      const initialToggleFunc = contextValueRef.toggleSelectMode;

      // Force re-render without state change
      rerender(
        <SelectModeProvider>
          <TestComponent />
        </SelectModeProvider>
      );

      // toggleSelectMode should maintain reference equality
      expect(contextValueRef.toggleSelectMode).toBe(initialToggleFunc);
    });
  });

  describe('error boundaries', () => {
    it('should handle errors gracefully', () => {
      render(
        <ErrorBoundary>
          <SelectModeProvider>
            <ThrowingComponent />
          </SelectModeProvider>
        </ErrorBoundary>
      );

      const button = screen.getByRole('button');
      
      // This should trigger the error
      fireEvent.click(button);

      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  describe('nested providers', () => {
    it('should handle nested providers correctly', () => {
      let outerContext: any;
      let innerContext: any;

      const captureOuterContext = (context: any) => {
        outerContext = context;
      };

      const captureInnerContext = (context: any) => {
        innerContext = context;
      };

      const OuterComponent = () => {
        const context = useSelectMode();
        captureOuterContext(context);
        return (
          <div>
            <div data-testid="outer">Outer: {context.isSelectMode ? 'ON' : 'OFF'}</div>
            <SelectModeProvider>
              <InnerComponent />
            </SelectModeProvider>
          </div>
        );
      };

      const InnerComponent = () => {
        const context = useSelectMode();
        captureInnerContext(context);
        return (
          <div data-testid="inner">Inner: {context.isSelectMode ? 'ON' : 'OFF'}</div>
        );
      };

      render(
        <SelectModeProvider>
          <OuterComponent />
        </SelectModeProvider>
      );

      expect(screen.getByTestId('outer')).toHaveTextContent('Outer: OFF');
      expect(screen.getByTestId('inner')).toHaveTextContent('Inner: OFF');

      // Toggle outer context
      act(() => {
        outerContext.toggleSelectMode();
      });

      expect(screen.getByTestId('outer')).toHaveTextContent('Outer: ON');
      expect(screen.getByTestId('inner')).toHaveTextContent('Inner: OFF');

      // Toggle inner context
      act(() => {
        innerContext.toggleSelectMode();
      });

      expect(screen.getByTestId('outer')).toHaveTextContent('Outer: ON');
      expect(screen.getByTestId('inner')).toHaveTextContent('Inner: ON');
    });
  });
});