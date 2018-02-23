import React from 'react';
import renderer from 'react-test-renderer';
import Paragraphs from './Paragraphs';
import site from '../../utils/site';
import waitForHnData from '../../utils/waitForHnData';
import { mapper, uuid } from '../../utils/tests';

jest.mock('../../utils/site', () => {
  return require('../../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));
console.log = console.warn = console.error = message => {
  throw new Error(message);
};

beforeEach(() => {
  site.getData.mockRestore();
});

describe('Paragraphs', async () => {
  test('with required props', async () => {
    const component = await waitForHnData(
      <Paragraphs mapper={mapper} paragraphs={[{ target_uuid: uuid }]} />,
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  test('with all props', async () => {
    const component = await waitForHnData(
      <Paragraphs
        mapper={mapper}
        paragraphProps={{
          testProp: 'testPropValue',
        }}
        paragraphs={[{ target_uuid: uuid }]}
        Wrapper={'section'}
        page={{ pageTest: true }}
      />,
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });
});
