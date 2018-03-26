import fetchMock from 'fetch-mock';
import { Site } from '..';

fetchMock.get(
  'http://headless.ninja/tests/hn?_format=hn&path=%2Ftest123',
  require('./response-1.json'), // tslint:disable-line:no-var-requires
);

test('creating a site', () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });
  expect(site).toBeInstanceOf(Site);
  expect(typeof site.getPage).toBe('function');
});

test('getting a page', () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });
  site
    .getPage('/test123')
    .then(entityUUID => {
      expect(entityUUID).toBe('e3842f1c-e148-46ae-a3e8-c03badbcb05b');
      expect(site.getData(entityUUID).body.value).toBe('This is a body');
    })
    .catch(err => {
      throw new Error(err);
    });
});
