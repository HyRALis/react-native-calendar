import type { TextStyle } from 'react-native';

export const colors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#172B3A',
  muted: '#586B78',
  primary: '#126D61',
  primaryLight: '#E5F3EF',
  border: '#D5DEE3',
  error: '#AD3030',
  onPrimary: '#FFFFFF',
  disabledSurface: '#E9EEF1',
} as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = { sm: 6, md: 12, lg: 14, xl: 20 } as const;
export const controlSizes = { sm: 44, md: 52, lg: 60 } as const;
export type ControlSize = keyof typeof controlSizes;
export const opacity = { pressed: 0.8, disabled: 0.55 } as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '700' },
  heading: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  overline: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
