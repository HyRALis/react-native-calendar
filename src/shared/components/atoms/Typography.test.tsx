import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Typography } from './Typography';

test('preserves native text semantics and caller styling', () => {
  render(
    <Typography
      variant="heading"
      tone="primary"
      accessibilityRole="header"
      selectable
      style={{ textAlign: 'center' }}
    >
      Meetings
    </Typography>,
  );
  const heading = screen.getByRole('header', { name: 'Meetings' });
  expect(heading).toHaveProp('selectable', true);
  expect(heading).toHaveStyle({ fontSize: 32, textAlign: 'center' });
  expect(heading.props.allowFontScaling).not.toBe(false);
});

test('visual headings do not automatically become semantic headings', () => {
  render(<Typography variant="title">A decorative title</Typography>);
  expect(screen.queryByRole('header')).toBeNull();
});
