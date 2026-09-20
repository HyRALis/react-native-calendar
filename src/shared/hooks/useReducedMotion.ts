import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  const currentValue = useRef(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        changed = true;
        if (currentValue.current !== value) {
          currentValue.current = value;
          setReduced(value);
        }
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (active && !changed && currentValue.current !== value) {
          currentValue.current = value;
          setReduced(value);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
