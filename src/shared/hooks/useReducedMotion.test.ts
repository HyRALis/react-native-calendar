import { AccessibilityInfo } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useReducedMotion } from './useReducedMotion';

afterEach(() => jest.restoreAllMocks());

test('uses the system setting and responds to changes without a stale initial read', async () => {
  let resolve!: (value: boolean) => void;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(
    new Promise(done => {
      resolve = done;
    }),
  );
  const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener');
  subscribe.mockClear();
  const { result, unmount } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);
  const onChange = subscribe.mock.calls[0][1];
  act(() => onChange(true));
  await act(async () => resolve(false));
  expect(result.current).toBe(true);
  act(() => onChange(false));
  expect(result.current).toBe(false);
  const subscription = subscribe.mock.results[0].value;
  unmount();
  expect(subscription.remove).toHaveBeenCalled();
});

test('keeps motion disabled when the platform setting cannot be read', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockRejectedValue(new Error('unavailable'));
  const { result } = renderHook(() => useReducedMotion());
  await act(async () => {});
  expect(result.current).toBe(true);
});
