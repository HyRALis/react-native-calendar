import { buildTimeOptions, formatTimeOfDay, minutesInDay } from './timeOfDay';

test('a quarter-hour step covers the whole day once', () => {
  const options = buildTimeOptions(15);

  expect(options).toHaveLength(96);
  expect(options[0].value).toBe(0);
  expect(options[options.length - 1].value).toBe(minutesInDay - 15);
});

test('a time between two slots is inserted in order', () => {
  const options = buildTimeOptions(60, 90);

  expect(options).toHaveLength(25);
  expect(options.map(option => option.value).slice(0, 4)).toEqual([
    0, 60, 90, 120,
  ]);
});

test.each([
  ['a time already on the grid', 120],
  ['a time outside the day', minutesInDay],
  ['a negative time', -30],
])('%s adds no extra slot', (_name, include) => {
  expect(buildTimeOptions(60, include)).toHaveLength(24);
});

test('labels are read as times in the device locale', () => {
  const expected = new Date(2001, 0, 1, 13, 30).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  expect(formatTimeOfDay(13 * 60 + 30)).toBe(expected);
  expect(buildTimeOptions(30)[27].label).toBe(expected);
});

test('a floor drops every slot before it', () => {
  const options = buildTimeOptions(60, undefined, 9 * 60);

  expect(options[0].value).toBe(9 * 60);
  expect(options).toHaveLength(15);
});

test('a floor between two slots rounds up to the next one', () => {
  expect(buildTimeOptions(15, undefined, 9 * 60 + 47)[0].value).toBe(10 * 60);
});

test('the time already chosen is still listed below the floor', () => {
  const options = buildTimeOptions(60, 8 * 60, 12 * 60);

  expect(options[0].value).toBe(8 * 60);
  expect(options[1].value).toBe(12 * 60);
});
