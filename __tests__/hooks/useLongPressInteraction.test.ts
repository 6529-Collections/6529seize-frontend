import { renderHook, act } from '@testing-library/react';
import useLongPressInteraction from '@/hooks/useLongPressInteraction';

jest.useFakeTimers();

describe('useLongPressInteraction', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useLongPressInteraction());
    
    expect(result.current.isActive).toBe(false);
    expect(result.current.longPressTriggered).toBe(false);
    expect(result.current.touchHandlers).toBeDefined();
  });

  it('does not trigger on touch when hasTouchScreen is false', () => {
    const onInteractionStart = jest.fn();
    const { result } = renderHook(() => 
      useLongPressInteraction({ hasTouchScreen: false, onInteractionStart })
    );
    
    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    act(() => {
      result.current.touchHandlers.onTouchStart(mockTouchEvent);
    });
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(onInteractionStart).not.toHaveBeenCalled();
  });

  it('triggers long press after duration when hasTouchScreen is true', () => {
    const onInteractionStart = jest.fn();
    const { result } = renderHook(() => 
      useLongPressInteraction({ 
        hasTouchScreen: true, 
        onInteractionStart,
        longPressDuration: 500
      })
    );
    
    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    act(() => {
      result.current.touchHandlers.onTouchStart(mockTouchEvent);
    });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(onInteractionStart).toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
    expect(result.current.longPressTriggered).toBe(true);
  });

  it('cancels long press on touch move beyond threshold', () => {
    const onInteractionStart = jest.fn();
    const { result } = renderHook(() => 
      useLongPressInteraction({ 
        hasTouchScreen: true, 
        onInteractionStart,
        moveThreshold: 10
      })
    );
    
    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    const moveEvent = {
      touches: [{ clientX: 120, clientY: 100 }], // moved 20px, beyond threshold
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    act(() => {
      result.current.touchHandlers.onTouchStart(startEvent);
    });
    
    act(() => {
      result.current.touchHandlers.onTouchMove(moveEvent);
    });
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(onInteractionStart).not.toHaveBeenCalled();
  });

  it('does not cancel long press on small movement', () => {
    const onInteractionStart = jest.fn();
    const { result } = renderHook(() => 
      useLongPressInteraction({ 
        hasTouchScreen: true, 
        onInteractionStart,
        moveThreshold: 10
      })
    );
    
    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    const moveEvent = {
      touches: [{ clientX: 105, clientY: 103 }], // moved 5px, within threshold
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    act(() => {
      result.current.touchHandlers.onTouchStart(startEvent);
    });
    
    act(() => {
      result.current.touchHandlers.onTouchMove(moveEvent);
    });
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(onInteractionStart).toHaveBeenCalled();
  });

  it('clears timeout and resets state on touch end', () => {
    const onInteractionStart = jest.fn();
    const { result } = renderHook(() => 
      useLongPressInteraction({ 
        hasTouchScreen: true, 
        onInteractionStart
      })
    );
    
    const mockTouchEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
      preventDefault: jest.fn()
    } as React.TouchEvent;
    
    act(() => {
      result.current.touchHandlers.onTouchStart(mockTouchEvent);
    });
    
    act(() => {
      result.current.touchHandlers.onTouchEnd();
    });
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
    
    expect(onInteractionStart).not.toHaveBeenCalled();
    expect(result.current.longPressTriggered).toBe(false);
  });

  it('allows manual control of isActive state', () => {
    const { result } = renderHook(() => useLongPressInteraction());
    
    expect(result.current.isActive).toBe(false);
    
    act(() => {
      result.current.setIsActive(true);
    });
    
    expect(result.current.isActive).toBe(true);
  });
});