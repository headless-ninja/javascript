import * as React from 'react';
import * as renderer from 'react-test-renderer';
import site from '../utils/site';
import { asyncMapper, mapper, SiteMock, uuid, uuid2 } from '../utils/tests';
import waitForHnData from '../utils/waitForHnData';
import DrupalPage from './DrupalPage';

const siteMock: SiteMock = site as any;

jest.mock('../utils/site', () => {
  return require('../utils/tests').mockSite();
});

jest.mock('util-deprecate', () => jest.fn(func => func));

describe('DrupalPage', async () => {
  test('without any mapper', async () => {
    const component = <DrupalPage url={'/'} />;

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toBe(null)
  });

  test('with required props', async () => {
    const component = <DrupalPage mapper={mapper} url={'/'} />;

    const withoutWaiting = renderer.create(component).toJSON();
    const withWaiting = renderer
      .create(await waitForHnData(component))
      .toJSON();

    expect(withoutWaiting).toMatchSnapshot();
    expect(withWaiting).toEqual(withoutWaiting);
  });

  test('with all props', async () => {
    const component = (
      <DrupalPage
        mapper={mapper}
        url={'/'}
        layout={'div'}
        layoutProps={{ testLayoutProp: true }}
        renderWhileLoadingData
        pageProps={{ testPageProp: true }}
      />
    );

    siteMock.getUuid.mockReturnValue(undefined);
    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    siteMock.getUuid.mockReturnValue(uuid);
    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with asyncMapper', async () => {
    const component = (
      <DrupalPage
        asyncMapper={asyncMapper}
        url={'/'}
        layoutProps={{ testLayoutProp: true }}
        renderWhileLoadingData
        pageProps={{ testPageProp: true }}
      />
    );

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('with asyncMapper as boolean (deprecated)', async () => {
    const component = (
      <DrupalPage
        asyncMapper
        mapper={asyncMapper}
        url={'/'}
        layoutProps={{ testLayoutProp: true }}
        renderWhileLoadingData
        pageProps={{ testPageProp: true }}
      />
    );

    siteMock.getUuid.mockReturnValueOnce(undefined);

    expect(renderer.create(component).toJSON()).toMatchSnapshot();

    siteMock.getUuid.mockReturnValueOnce(undefined);
    expect(
      renderer.create(await waitForHnData(component)).toJSON(),
    ).toMatchSnapshot();
  });

  test('when getPage fails', async () => {
    const log = jest.fn();

    class ErrorBoundary extends React.Component {
      componentDidCatch() {
        log();
      }
      render() {
        return this.props.children;
      }
    }
    const component = (
      <ErrorBoundary>
        <DrupalPage mapper={{}} url={'/newUrl'} />
      </ErrorBoundary>
    );

    siteMock.getUuid.mockReturnValue(undefined);
    siteMock.getPage.mockImplementationOnce(async () => {
      throw new Error('Error!');
    });

    const rendererEntry = renderer.create(component);

    await new Promise(r => process.nextTick(r));

    expect(rendererEntry.toJSON()).toBe(null);
    expect(log).toHaveBeenCalledTimes(1);
    expect(siteMock.getPage).toHaveBeenCalledTimes(1);

    siteMock.getUuid.mockReturnValue(uuid);
  });

  test('changing props', async () => {
    // Render entity 1 as usual.
    const rendererEntry = renderer.create(
      <DrupalPage mapper={mapper} url={'/'} />,
    );
    await new Promise(r => process.nextTick(r));

    expect(rendererEntry.toJSON()).toMatchSnapshot();

    // Intercept the next site.getPage call.
    let resolveGetPage;
    siteMock.getPage.mockImplementationOnce(
      () => new Promise(r => (resolveGetPage = r)),
    );
    siteMock.getUuid.mockReturnValue(undefined);

    // Change the url.
    rendererEntry.update(<DrupalPage mapper={mapper} url={'/new-url'} />);
    await new Promise(r => process.nextTick(r));

    // Now null should be rendered, as long as the new data is not available.
    expect(rendererEntry.toJSON()).toEqual(null);

    // Make new data available.
    siteMock.getUuid.mockImplementation(page =>
      page === '/new-url' ? uuid2 : undefined,
    );
    resolveGetPage(uuid2);
    await new Promise(r => process.nextTick(r));

    // Now entity 2 should be rendered.
    const entity2Result = rendererEntry.toJSON();
    expect(entity2Result).toMatchSnapshot();

    // Intercept the next site.getPage call.
    let resolveGetPage2;
    siteMock.getPage.mockImplementationOnce(
      () => new Promise(r => (resolveGetPage2 = r)),
    );

    // Start the loading of a new url.
    rendererEntry.update(
      <DrupalPage
        mapper={mapper}
        url={'/another-new-url'}
        renderWhileLoadingData
      />,
    );
    await new Promise(r => process.nextTick(r));

    // The component should't have changed.
    expect(rendererEntry.toJSON()).toEqual(entity2Result);

    // Add a layout component.
    rendererEntry.update(
      <DrupalPage
        mapper={mapper}
        url={'/another-new-url'}
        renderWhileLoadingData
        layout="div"
      />,
    );

    // The new layout component should have the loadingData prop set to true.
    const childWrapper = rendererEntry.root
      .children[0] as renderer.ReactTestInstance;
    const child = childWrapper.children[0] as renderer.ReactTestInstance;
    expect(child.props.loadingData).toBe(true);

    // Intercept the next set.getPage call.
    let resolveGetPage3;
    siteMock.getPage.mockImplementationOnce(
      () => new Promise(r => (resolveGetPage3 = r)),
    );

    // Load a new page (while the other page hasn't finished loading yet). Remove the layout.
    rendererEntry.update(
      <DrupalPage mapper={mapper} url={'/fresh-url'} renderWhileLoadingData />,
    );
    await new Promise(r => process.nextTick(r));

    // The component now should be the same as when before we started loading the new page.
    expect(rendererEntry.toJSON()).toEqual(entity2Result);

    // We resolve the first page. This shouldn't do anything, because it's not the latest url.
    siteMock.getUuid.mockImplementation(page =>
      page === '/fresh-url' ? undefined : uuid2,
    );
    resolveGetPage2(uuid2);

    await new Promise(r => process.nextTick(r));
    expect(rendererEntry.toJSON()).toEqual(entity2Result);

    // Now we resolve the latest page. This should render entity 1.
    siteMock.getUuid.mockImplementation(page =>
      page === '/fresh-url' ? uuid : uuid2,
    );
    resolveGetPage3(uuid);
    await new Promise(r => process.nextTick(r));
    expect(rendererEntry.toJSON()).toMatchSnapshot();
  });
});
