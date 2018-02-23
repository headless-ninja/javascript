import { DrupalPage, site, EntityMapper, Paragraph, EntityListMapper, Paragraphs, waitForHnData } from './';

test('exports', () => {
  expect(typeof DrupalPage).toBe('function');
  expect(typeof site).toBe('object');
  expect(typeof EntityMapper).toBe('function');
  expect(typeof Paragraph).toBe('function');
  expect(typeof EntityListMapper).toBe('function');
  expect(typeof Paragraphs).toBe('function');
  expect(typeof waitForHnData).toBe('function');
});
