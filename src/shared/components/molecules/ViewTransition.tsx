import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function ViewTransition({ children }: React.PropsWithChildren) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]);
  return (
    <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
