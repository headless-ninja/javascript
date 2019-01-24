import * as fetchMock from 'fetch-mock';
import { parse } from 'url';
import { Site } from '..';

(fetchMock as any).config.overwriteRoutes = false;

beforeEach(() => {
  fetchMock.get(
    'http://headless.ninja/tests/hn?_format=hn&path=%2Ftest123',
    async () => require('./response-1.json'),
  );

  fetchMock.get(
    'http://headless.ninja/tests/hn?_format=hn&path=%2Ftranslations',
    async () => require('./response-with-translations.json'),
  );
});

afterEach(() => {
  fetchMock.restore();
});

test('creating a site', () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });
  expect(site).toBeInstanceOf(Site);
  expect(typeof site.getPage).toBe('function');
});

test('initializing a site', () => {
  const site = new Site();
  site.initialize({ url: 'http://headless.ninja/tests' });
});

test('initializing a site twice', () => {
  const errorMessage = 'The site is already initialized.';

  // Lazy initializing twice should throw an error.
  const site = new Site();
  site.initialize({ url: 'http://headless.ninja/tests' });
  expect(() => {
    site.initialize({ url: 'http://headless.ninja/tests' });
  }).toThrow(errorMessage);

  // Initializing in constructor and then lazy initializing should throw.
  const site2 = new Site({ url: 'http://headless.ninja/tests' });
  expect(() => {
    site2.initialize({ url: 'http://headless.ninja/tests' });
  }).toThrow(errorMessage);

  // Resetting that site makes it re-initializable again.
  site2.reset();
  site2.initialize({ url: 'http://headless.ninja/tests' });
});

test('not initializing throws an error', () => {
  const errorMessage =
    'Site is not intitialized. Pass an object when creating a site, or use the initialize method.';

  const site = new Site();
  expect(() => {
    site.getPage('/test123');
  }).toThrow(errorMessage);
});

test('dehydrating and hydrating', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  const pageUUID1 = await site.getPage('/test123');
  const dehydration1 = site.dehydrate();

  // Create a new clean site with a different url.
  const site2 = new Site({ url: 'http://this-shoudnt-be-called' });

  // Without a hydration, this will throw.
  await expect((async () => site2.getPage('/test123'))()).rejects.toBeTruthy();

  // Hydrate to get page data from the working site.
  site2.hydrate(dehydration1);

  // Now, this should work.
  const pageUUID2 = await site2.getPage('/test123');
  const dehydration2 = site.dehydrate();

  expect(pageUUID1).toEqual(pageUUID2);
  expect(dehydration1).toEqual(dehydration2);
});

test('getting a page', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  // Synchronous call to getUuid should return undefined now.
  expect(site.getUuid('/test123')).toBeUndefined();

  // Fetch the page, which returns the uuid.
  const entityUUID = await site.getPage('/test123');
  expect(entityUUID).toBe('e3842f1c-e148-46ae-a3e8-c03badbcb05b');
  expect(site.getData(entityUUID).body.value).toBe('This is a body');

  // The synchronous call should now return the uuid.
  expect(site.getUuid('/test123')).toBe(entityUUID);
});

test('getting a page while its already loading', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  let anyPromiseResolved = false;

  const promise1 = site
    .getPage('/test123')
    .then(() => (anyPromiseResolved = true));
  const promise2 = site
    .getPage('/test123')
    .then(() => (anyPromiseResolved = true));

  // Make sure promises aren't resolved yet.
  expect(anyPromiseResolved).toBe(false);

  // Now resolve all promises.
  await Promise.all([promise1, promise2]);

  // There should only be one call made.
  expect(fetchMock.calls((true as any) as string).length).toBe(1);
});

test('getting a page twice', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  await site.getPage('/test123');
  await site.getPage('/test123');

  // There should only be one call made
  expect(fetchMock.calls((true as any) as string).length).toBe(1);
});

test('translate function', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  await site.getPage('/translations');

  expect(site.t('Text to translate', 'en')).toBe('Translate result');
  expect(site.t('Text to translate', 'nl')).toBe('Dutch translate result');

  // The default langcode should be determined based on the langcode of the current entity.
  // The default is english.
  history.pushState({}, 'page 2', '/unrelated-path');
  expect(site.t('Text to translate')).toBe('Translate result');

  // If we change the path to a dutch entity, the same command should return a dutch string.
  history.pushState({}, 'page 2', '/entity-with-nl-langcode');
  expect(site.t('Text to translate')).toBe('Dutch translate result');

  expect(site.t('Text without translation')).toBe('Text without translation');
  expect(site.t('Text without translation', 'en')).toBe(
    'Text without translation',
  );
  expect(site.t('Text without translation', 'nl')).toBe(
    'Text without translation',
  );
});

test('session based caching', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  await site.getPage('/test123');

  // The user id is now saved in the site, and next requests should have the user and tokens appended.

  await site.getPage('/test123'); // should not do an extra call, even though the path to request changed.

  // When we make 2 new requests at the same time, they return the same user id but other tokens.
  fetchMock.once('*', async () => ({
    __hn: { request: { user: 'unique-user-id', token: 'unique-token-2' } },
  }));
  fetchMock.once('*', async () => ({
    __hn: { request: { user: 'unique-user-id', token: 'unique-token-3' } },
  }));
  const promise1 = site.getPage('/minimal-request-with-token-1');
  const promise2 = site.getPage('/minimal-request-with-token-2');

  await Promise.all([promise1, promise2]);

  // The next request should have both tokens.
  fetchMock.once('*', async () => ({}));

  await site.getPage('/unrelated-path');

  const calls = fetchMock
    .calls((true as any) as string)
    .map(rawCall => parse(rawCall[0], true).query);

  // 4 calls should have been made.
  expect(calls.length).toBe(4);

  // First call should not have any user or token attached.
  expect(calls[0]._hn_user).toBeUndefined();
  expect(calls[0]._hn_verify).toBeUndefined();

  // Second and third call should have the same info attached.
  expect(calls[1]._hn_user).toBe('unique-user-id');
  expect(calls[1]._hn_verify).toBe('unique-token-1');
  expect(calls[2]._hn_user).toBe('unique-user-id');
  expect(calls[2]._hn_verify).toBe('unique-token-1');

  // Fourth call should have the same user id and two tokens attached.
  expect(calls[3]._hn_user).toBe('unique-user-id');
  expect((calls[3]._hn_verify as string[]).sort()).toEqual([
    'unique-token-2',
    'unique-token-3',
  ]);
});

test('getting data with failing fetch', async () => {
  const site = new Site({ url: 'http://headless.ninja/tests' });

  // Return a 500 error on the next fetch.
  fetchMock.once('*', async () => 500);

  await expect(site.getPage('/unrelated-path')).rejects.toHaveProperty(
    'message',
    'Error at path: http://headless.ninja/tests/hn?_format=hn&path=%2Funrelated-path: 500 - Internal Server Error',
  );
});
