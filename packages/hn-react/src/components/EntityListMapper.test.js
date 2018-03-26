import EntityListMapper from './EntityListMapper';
import React from 'react';
import renderer from 'react-test-renderer';
import site from '../utils/site';
import waitForHnData from '../utils/waitForHnData';
import { uuid, mapper, asyncMapper } from '../utils/tests';

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

describe('EntityListMapper', async () => {
  test('with required props, same bundle', async () => {
    const component = (
      <EntityListMapper entities={[uuid, 'unique-uuid-2']} mapper={mapper} />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with required props, different bundle', async () => {
    const component = (
      <EntityListMapper entities={[uuid, 'unique-uuid-3']} mapper={mapper} />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('non-existing entity', async () => {
    const component = (
      <EntityListMapper
        entities={[uuid, 'non-existing-entity']}
        mapper={mapper}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with all props', async () => {
    const component = (
      <EntityListMapper
        entities={[uuid, 'unique-uuid-3']}
        entityProps={{ testEntityProp: true }}
        entityWrapper={'main'}
        mapper={mapper}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('asyncMapper', async () => {
    const component = (
      <EntityListMapper
        entities={[uuid, 'unique-uuid-3']}
        entityProps={{ testEntityProp: true }}
        entityWrapper={'main'}
        asyncMapper={asyncMapper}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('asyncMapper as boolean (deprecated)', async () => {
    const component = (
      <EntityListMapper
        entities={[uuid, 'unique-uuid-3']}
        entityProps={{ testEntityProp: true }}
        entityWrapper={'main'}
        mapper={asyncMapper}
        asyncMapper
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('double HOC components', async () => {
    const component = (
      <EntityListMapper
        entities={['unique-uuid-3', 'unique-uuid-4']}
        entityProps={{ testEntityProp: true }}
        entityWrapper={'main'}
        mapper={mapper}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('2 mappers with double HOC components', async () => {
    const component = (
      <div>
        <EntityListMapper
          entities={['unique-uuid-3', 'unique-uuid-4']}
          entityProps={{ testEntityProp: true }}
          entityWrapper={'main'}
          mapper={mapper}
        />
        <EntityListMapper
          entities={['unique-uuid-3', 'unique-uuid-4']}
          entityProps={{ testEntityProp: true }}
          entityWrapper={'main'}
          mapper={mapper}
        />
      </div>
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });
});
