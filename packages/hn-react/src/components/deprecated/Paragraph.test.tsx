import React from 'react';
import renderer from 'react-test-renderer';
import site from '../../utils/site';
import { mapper, uuid } from '../../utils/tests';
import waitForHnData from '../../utils/waitForHnData';
import Paragraph from './Paragraph';

jest.mock('../../utils/site', () => {
  return require('../../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));

describe('Paragraph', async () => {
  test('with required props', async () => {
    const component = await waitForHnData(
      <Paragraph mapper={mapper} uuid={uuid} />,
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  test('with all props', async () => {
    const component = await waitForHnData(
      <Paragraph
        mapper={mapper}
        paragraphProps={{
          testProp: 'testPropValue',
        }}
        uuid={uuid}
        page={{ pageTest: true }}
        index={15}
      />,
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });
});
