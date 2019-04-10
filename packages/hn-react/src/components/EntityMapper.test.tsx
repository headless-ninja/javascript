import * as React from 'react';
import * as renderer from 'react-test-renderer';
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
  clearEntityCache,
  assureComponent,
} from './EntityMapper';

jest.mock('../utils/site', () => {
  return require('../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));

describe('EntityMapper', async () => {
  afterEach(() => {
    clearEntityCache();
  });

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

    expect(renderer.create(component).toJSON()).toBe(null);

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('asyncMapper as boolean (deprecated)', async () => {
    const component = (
      <EntityMapper uuid={uuid} mapper={asyncMapper} asyncMapper />
    );

    expect(renderer.create(component).toJSON()).toBe(null);

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('function mapper', async () => {
    const customMapper = jest.fn((_, typeBundle) => mapper[typeBundle]);

    const component = <EntityMapper uuid={uuid} mapper={customMapper} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(customMapper).toHaveBeenCalledWith(
      entity,
      'unique_type_1__unique_bundle_1',
    );
  });

  test('async mapper that fails loading', async () => {
    const importLike = jest.fn(async () => {
      throw new Error('No connection.');
    });
    const customMapper = {
      unique_type_1__unique_bundle_1: importLike,
    };
    const log = jest.fn();

    class ErrorBoundary extends React.Component {
      componentDidCatch() {
        log();
      }
      render() {
        return this.props.children;
      }
    }

    // Render the EntityMapper that will fail.
    const rendererEntry = renderer.create(
      <ErrorBoundary>
        <EntityMapper uuid={uuid} asyncMapper={customMapper} />
      </ErrorBoundary>,
    );

    // When the component isn't loaded yet, should just render null.
    expect(log).toBeCalledTimes(0);
    expect(rendererEntry.toJSON()).toBe(null);

    // Let the promise reject.
    await new Promise(resolve => process.nextTick(resolve));

    // The error boundry should be called, and still null should be rendered.
    expect(log).toBeCalledTimes(1);
    expect(rendererEntry.toJSON()).toBe(null);

    // When something changes, it should retry.
    rendererEntry.update(
      <ErrorBoundary>
        <EntityMapper uuid={uuid} asyncMapper={customMapper} />
      </ErrorBoundary>,
    );
    expect(log).toBeCalledTimes(1);

    await new Promise(resolve => process.nextTick(resolve));
    expect(log).toBeCalledTimes(2);
  });

  test('assure component with mapper not supporting bundle', async () => {
    expect(assureComponent({ site, uuid, asyncMapper: {} })).resolves.toBe(
      undefined,
    );
  });

  async function setupPropsChange() {
    let resolveEntity1Promise;
    let resolveEntity2Promise;
    const customAsyncMapper = {
      unique_type_1__unique_bundle_1: jest.fn(
        () => new Promise(r => (resolveEntity1Promise = r)),
      ),
      unique_type_2__unique_bundle_2: jest.fn(
        () => new Promise(r => (resolveEntity2Promise = r)),
      ),
    };

    const rendererEntry = renderer.create(
      <EntityMapper uuid={uuid} asyncMapper={customAsyncMapper} />,
    );

    await new Promise(resolve => process.nextTick(resolve));
    expect(customAsyncMapper.unique_type_1__unique_bundle_1).toBeCalledTimes(1);

    rendererEntry.update(
      <EntityMapper uuid={uuid2} asyncMapper={customAsyncMapper} />,
    );

    await new Promise(resolve => process.nextTick(resolve));
    expect(customAsyncMapper.unique_type_2__unique_bundle_2).toBeCalledTimes(1);
    return { resolveEntity1Promise, resolveEntity2Promise, rendererEntry };
  }

  test(`change props while already loading 1`, async () => {
    const {
      resolveEntity1Promise,
      resolveEntity2Promise,
      rendererEntry,
    } = await setupPropsChange();

    resolveEntity1Promise('section');
    expect(rendererEntry.toJSON()).toBe(null);

    resolveEntity2Promise('div');
    await new Promise(resolve => process.nextTick(resolve));
    expect(rendererEntry.root.findByType('div').props.bundle).toBe(
      'unique_type_2__unique_bundle_2',
    );
  });

  test(`change props while already loading 2`, async () => {
    const {
      resolveEntity1Promise,
      resolveEntity2Promise,
      rendererEntry,
    } = await setupPropsChange();

    resolveEntity2Promise('section');
    await new Promise(resolve => process.nextTick(resolve));
    const json = rendererEntry.toJSON();
    expect(rendererEntry.root.findByType('section').props.bundle).toEqual(
      'unique_type_2__unique_bundle_2',
    );

    resolveEntity1Promise('div');
    expect(rendererEntry.toJSON()).toEqual(json);
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
