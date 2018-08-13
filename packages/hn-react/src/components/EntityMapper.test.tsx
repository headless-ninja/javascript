import React from 'react';
import renderer from 'react-test-renderer';
import site from '../utils/site';
import {
  asyncMapper,
  entity,
  entity2,
  mapper,
  uuid,
  uuid2,
} from '../utils/tests';
import waitForHnData from '../utils/waitForHnData';
import EntityMapper, {
  EntityMapper as InnerEntityMapper,
} from './EntityMapper';

jest.mock('../utils/site', () => {
  return require('../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));

describe('EntityMapper', async () => {
  test('with required props', async () => {
    const component = <EntityMapper uuid={uuid} mapper={mapper} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('non-existing entity', async () => {
    const component = (
      <EntityMapper uuid={'non-existing-entity'} mapper={mapper} />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with required props & asyncMapper', async () => {
    const component = <EntityMapper uuid={uuid} asyncMapper={asyncMapper} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with all props', async () => {
    const component = (
      <EntityMapper
        entityProps={{ testEntityProp: true }}
        uuid={uuid}
        mapper={mapper}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with all props & asyncMapper', async () => {
    const component = (
      <EntityMapper
        entityProps={{ testEntityProp: true }}
        uuid={uuid}
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
      <EntityMapper uuid={uuid} mapper={asyncMapper} asyncMapper />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('function mapper', async () => {
    const customMapper = jest.fn((_, typeBundle) => mapper[typeBundle]);

    const component = <EntityMapper uuid={uuid} mapper={customMapper} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(customMapper).toHaveBeenCalledTimes(1);
    expect(customMapper).toHaveBeenCalledWith(
      entity,
      'unique_type_1__unique_bundle_1',
    );
  });

  test('changing props', async () => {
    const ref = React.createRef<InnerEntityMapper>();
    // First, render uuid1.
    const rendererEntry = renderer.create(
      <EntityMapper uuid={uuid} mapper={mapper} ref={ref} />,
    );
    // Then, change uuid1 to uuid2.
    rendererEntry.update(
      <EntityMapper uuid={uuid2} mapper={mapper} ref={ref} />,
    );
    // Wait one tick to let React update.
    await new Promise(resolve => process.nextTick(resolve));
    // This should render the entity of uuid2.
    const entity2Result = rendererEntry.toJSON();
    expect(entity2Result).toMatchSnapshot();

    expect(ref.current.isReady()).toBe(true);

    let resolveEntity1Promise;
    let resolveEntity2Promise;

    const entity1Promise: Promise<string> = new Promise(
      resolve => (resolveEntity1Promise = resolve),
    );
    const entity2Promise: Promise<string> = new Promise(
      resolve => (resolveEntity2Promise = resolve),
    );

    const customAsyncMapper = {
      unique_type_1__unique_bundle_1: () => entity1Promise,
      unique_type_2__unique_bundle_2: () => entity2Promise,
    };

    // Now we're changing the mapper for a asyncMapper, but keeping the uuid.
    rendererEntry.update(
      <EntityMapper
        uuid={uuid2}
        mapper={customAsyncMapper}
        asyncMapper
        ref={ref}
      />,
    );

    // Wait one tick to let React update.
    await new Promise(resolve => process.nextTick(resolve));

    // The EntityMapper shouldn't have changed, and marked as not-ready.
    expect(ref.current.isReady()).toBe(false);
    expect(rendererEntry.toJSON()).toEqual(entity2Result);

    // Now we resolve the promise of the async entity.
    resolveEntity2Promise('section');
    await new Promise(resolve => process.nextTick(resolve));

    // It should now be ready, and its contents should have changed.
    expect(ref.current.isReady()).toBe(true);
    const asyncEntity2Result = rendererEntry.toJSON();
    expect(
      ((rendererEntry.root.children[0] as renderer.ReactTestInstance)
        .children[0] as renderer.ReactTestInstance).type,
    ).toBe('section');

    // Now we change the uuid and add entityProps.
    rendererEntry.update(
      <EntityMapper
        uuid={uuid}
        mapper={customAsyncMapper}
        asyncMapper
        ref={ref}
        entityProps={{ testEntityProp: 'test123' }}
      />,
    );
    await new Promise(resolve =>
      process.nextTick(() => process.nextTick(resolve)),
    );

    // The EntityMapper shouldn't have changed, and marked as not-ready.
    expect(ref.current.isReady()).toBe(false);
    expect(rendererEntry.toJSON()).toEqual(asyncEntity2Result);

    // Now we resolve the promise of the async entity.
    resolveEntity1Promise('p');
    await new Promise(resolve => process.nextTick(resolve));
    expect(ref.current.isReady()).toBe(true);
    const innerwrapper = rendererEntry.root
      .children[0] as renderer.ReactTestInstance;
    const result = innerwrapper.children[0] as renderer.ReactTestInstance;
    expect(result.type).toBe('p');
    expect(result.props.testEntityProp).toBe('test123');

    // Now change the uuid prop to a non-existing uuid.
    rendererEntry.update(
      <EntityMapper
        uuid={'doesntexist'}
        mapper={customAsyncMapper}
        asyncMapper
        ref={ref}
        entityProps={{ testEntityProp: 'test123' }}
      />,
    );
    await new Promise(resolve => process.nextTick(resolve));

    expect(rendererEntry.toJSON()).toBe(null);
  });
});
