import { Site } from 'hn';
import site from './site';

test('site util', () => {
  expect(site).toBeInstanceOf(Site);
});
