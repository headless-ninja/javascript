import * as React from 'react';
import * as renderer from 'react-test-renderer';
import site from '../../utils/site';
import { mapper, uuid } from '../../utils/tests';
import waitForHnData from '../../utils/waitForHnData';
import Paragraphs from './Paragraphs';

jest.mock('../../utils/site', () => {
  return require('../../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));

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
