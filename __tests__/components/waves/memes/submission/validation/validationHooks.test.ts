import { renderHook, act } from '@testing-library/react';
import { useTraitsValidation } from '../../../../../../components/waves/memes/submission/validation/validationHooks';
import { validateTraitsData } from '../../../../../../components/waves/memes/submission/validation/traitsValidation';
import { TraitsData } from '../../../../../../components/waves/memes/submission/types/TraitsData';

jest.mock('../../../../../../components/waves/memes/submission/validation/traitsValidation');

const mockValidate = validateTraitsData as jest.Mock;

function createTraits(): TraitsData {
  return {
    title: 't',
    description: 'd',
    artist: '',
    seizeArtistProfile: '',
    palette: '',
    style: '',
    jewel: '',
    superpower: '',
    dharma: '',
    gear: '',
    clothing: '',
    element: '',
    mystery: '',
    secrets: '',
    weapon: '',
    home: '',
    parent: '',
    sibling: '',
    food: '',
    drink: '',
    bonus: '',
    boost: '',
    punk6529: false,
    gradient: false,
    movement: false,
    dynamic: false,
    interactive: false,
    collab: false,
    om: false,
    threeD: false,
    pepe: false,
    gm: false,
    summer: false,
    tulip: false,
    memeName: '',
    pointsPower: 1,
    pointsWisdom: 2,
    pointsLoki: 3,
    pointsSpeed: 4,
  };
}

describe('useTraitsValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidate.mockReturnValue({ isValid: true, errors: {}, errorCount: 0 });
  });

  it('tracks touched fields and validates on change', () => {
    const traits = createTraits();
    const { result, rerender } = renderHook(({ t }) => useTraitsValidation(t, traits), {
      initialProps: { t: traits },
    });

    expect(mockValidate).toHaveBeenLastCalledWith(traits, expect.objectContaining({
      mode: 'touched',
    }));

    act(() => {
      result.current.markFieldTouched('artist');
    });
    rerender({ t: traits });

    const lastOptions = mockValidate.mock.calls[mockValidate.mock.calls.length - 1][1];
    expect(lastOptions.touchedFields.has('artist')).toBe(true);
    expect(result.current.touchedFields.has('artist')).toBe(true);
  });

  it('marks all fields touched', () => {
    const traits = createTraits();
    const { result } = renderHook(() => useTraitsValidation(traits, traits));
    act(() => {
      result.current.markAllFieldsTouched();
    });
    expect(result.current.touchedFields.size).toBe(Object.keys(traits).length);
  });

  it('validateAll switches to all mode and returns result', () => {
    const traits = createTraits();
    mockValidate.mockReturnValue({ isValid: true, errors: {}, errorCount: 0 });
    const { result } = renderHook(() => useTraitsValidation(traits, traits));
    mockValidate.mockReturnValue({ isValid: false, errors: {}, errorCount: 1 });
    let validation: any;
    act(() => {
      validation = result.current.validateAll();
    });
    expect(validation).toEqual({ isValid: false, errors: {}, errorCount: 1 });
    expect(result.current.submitAttempted).toBe(true);
    expect(mockValidate).toHaveBeenCalledWith(traits, { mode: 'all' });
  });

  it('resets validation state', () => {
    const traits = createTraits();
    const { result } = renderHook(() => useTraitsValidation(traits, traits));
    act(() => {
      result.current.markFieldTouched('title');
      result.current.validateAll();
      result.current.resetValidation();
    });
    expect(result.current.touchedFields.size).toBe(0);
    expect(result.current.submitAttempted).toBe(false);
  });

  it('focuses first invalid field when element exists', () => {
    jest.useFakeTimers();
    const traits = createTraits();
    mockValidate.mockReturnValue({
      isValid: false,
      errors: { title: 'err' } as any,
      errorCount: 1,
      firstInvalidField: 'title',
    });
    const element = document.createElement('div');
    element.focus = jest.fn();
    element.scrollIntoView = jest.fn();
    element.classList.add = jest.fn();
    element.classList.remove = jest.fn();
    element.getBoundingClientRect = jest.fn(() => ({ top: 0 } as any));
    const querySpy = jest.spyOn(document, 'querySelector').mockReturnValue(element);
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const { result } = renderHook(() => useTraitsValidation(traits, traits));
    act(() => {
      result.current.focusFirstInvalidField();
    });
    expect(querySpy).toHaveBeenCalled();
    expect(element.focus).toHaveBeenCalled();
    expect(element.scrollIntoView).toHaveBeenCalled();
    expect(element.classList.add).toHaveBeenCalledWith('tw-highlight-focus');
    jest.advanceTimersByTime(2000);
    expect(element.classList.remove).toHaveBeenCalledWith('tw-highlight-focus');

    querySpy.mockRestore();
    scrollSpy.mockRestore();
    jest.useRealTimers();
  });

  it('logs warning when element not found in development', () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    mockValidate.mockReturnValue({
      isValid: false,
      errors: {},
      errorCount: 1,
      firstInvalidField: 'title',
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(document, 'querySelector').mockReturnValue(null);

    const traits = createTraits();
    const { result } = renderHook(() => useTraitsValidation(traits, traits));
    act(() => {
      result.current.focusFirstInvalidField();
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    process.env.NODE_ENV = oldEnv;
  });
});
