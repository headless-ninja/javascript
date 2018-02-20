import { Paragraphs } from './index';
import React from 'react';
import renderer from 'react-test-renderer';
import site from './site';
import waitForHnData from './DrupalPage/waitForHnData';
import { mapper, uuid } from './utils/tests';

jest.mock('./site', () => {
  return require('./utils/tests').mockSite();
});
console.warn = jest.fn();

beforeEach(() => {
  console.warn.mockRestore();
  site.getData.mockRestore();
});

describe('Deprecated components', async () => {

  describe('Paragraphs', async () => {

    test('with required props', async() => {
      const component = await waitForHnData(
        <Paragraphs
          mapper={mapper}
          paragraphs={[{target_id: uuid}]}
        />
      );

      expect(renderer.create(component).toJSON()).toMatchSnapshot();

      expect(console.warn).toBeCalledWith('Warning: The prop "paragraphs" is replaced by "entities".');
      expect(console.warn).toBeCalledWith('Warning: The component "Paragraphs" is deprecated, use "EntityListMapper" instead.');
    });

    test('with all props', async() => {
      const component = await waitForHnData(
        <Paragraphs
          mapper={mapper}
          paragraphProps={{
            testProp: 'testPropValue'
          }}
          paragraphs={[{target_id: uuid}]}
          Wrapper={'section'}
          page={{'pageTest': true}}
        />
      );

      expect(renderer.create(component).toJSON()).toMatchSnapshot();

      expect(console.warn).toBeCalledWith('Warning: The prop "paragraphs" is replaced by "entities".');
      expect(console.warn).toBeCalledWith('Warning: The prop "paragraphProps" is replaced by "entityProps".');
      expect(console.warn).toBeCalledWith('Warning: The component "Paragraphs" is deprecated, use "EntityListMapper" instead.');
      expect(console.warn).toBeCalledWith('Warning: The prop "page" is deprecated. Please use "entityProps={{ page }}" instead.');
    });
  });

});
