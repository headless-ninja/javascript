import DrupalPage from './DrupalPage';
import React from 'react';
import renderer from 'react-test-renderer';
import site from '../utils/site';
import waitForHnData from '../utils/waitForHnData';
import { mapper } from '../utils/tests';

jest.mock('../utils/site', () => {
  return require('../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));
console.log = console.warn = console.error = jest.fn(message => {
  throw new Error(message);
});

beforeEach(() => {
  site.getData.mockRestore();
});

describe('DrupalPage', async () => {
  test('with required props', async () => {
    const component = <DrupalPage mapper={mapper} url={'/'} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with all props', async () => {
    const component = (
      <DrupalPage
        mapper={mapper}
        url={'/'}
        layout={'div'}
        layoutProps={{ testLayoutProp: true }}
        renderWhileLoadingData={true}
        pageProps={{ testPageProp: true }}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });
});
