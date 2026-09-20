import { clampIndex, pageIndexFromOffset } from './paging';

test.each([
  [0, 320, 10, 0],
  [320, 320, 10, 1],
  [159, 320, 10, 0],
  [161, 320, 10, 1],
  [-40, 320, 10, 0],
  [99999, 320, 10, 9],
  [640, 0, 10, 0],
  [640, 320, 0, 0],
])(
  'offset %i over width %i of %i pages settles on page %i',
  (offset, width, count, expected) => {
    expect(pageIndexFromOffset(offset, width, count)).toBe(expected);
  },
);

test('clampIndex keeps an index inside the list', () => {
  expect(clampIndex(-3, 5)).toBe(0);
  expect(clampIndex(9, 5)).toBe(4);
  expect(clampIndex(2, 5)).toBe(2);
  expect(clampIndex(2, 0)).toBe(0);
});
