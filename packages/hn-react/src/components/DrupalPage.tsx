import { Site } from 'hn';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { SiteConsumer } from '../context/site';
import EntityMapper, {
  EntityMapper as InnerEntityMapper,
  EntityMapperPropsMapper,
} from './EntityMapper';

interface DrupalPageState {
  error: typeof Error | null;
}

class DrupalPage extends React.Component<
  DrupalPageInnerProps,
  DrupalPageState
> {
  state: DrupalPageState = { error: null };
  lastAssuredProps: DrupalPageInnerProps | null = null;

  async bootstrap() {
    const { uuid } = await DrupalPage.assureData(this.props);

    return InnerEntityMapper.assureComponent({ ...this.props, uuid });
  }

  /**
   * Checks if we can render sychronously from a set of props.
   * If the data isn't available yet, or if an async mapper is used of which the
   * component didn't load yet, we return false. Otherwise true.
   */
  canRenderFromProps(props: DrupalPageInnerProps) {
    const uuid = props.site.getUuid(props.url);

    if (!uuid) return false;

    return !!InnerEntityMapper.getComponentFromMapper({ ...props, uuid });
  }

  lastRequest: symbol | undefined;

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const lastRequest = (this.lastRequest = Symbol());

    // If we can render from the current set of props, we need to change lastAssuredProps
    // to the current props. If the props change to something else that we can't render
    // from yet, we can always fallback to these props.
    if (this.canRenderFromProps(this.props)) {
      this.lastAssuredProps = this.props;
      return;
    }

    // If we can't render from props yet, we need to fetch our data and assure the mapper
    // is ready.
    (async () => {
      // First, make sure we load the url into the site cache.
      const { uuid } = await DrupalPage.assureData(this.props);

      // If in the meantime the props updated, stop.
      if (lastRequest !== this.lastRequest) return;

      // Make sure the mapper is ready by loading the async component into the mapper
      // cache.
      await InnerEntityMapper.assureComponent({
        ...this.props,
        uuid,
      });

      // If in the meantime the props updated, stop.
      if (lastRequest !== this.lastRequest) return;

      // This is in theory an unnessecary check; when we've reached this point, we should
      // be able to render from these props. However, if something did go wrong somehow,
      // we don't want to force an update. If we do that, we run into an forever running
      // loop.

      // istanbul ignore next
      if (!this.canRenderFromProps(this.props)) {
        throw Error("The data can't be loaded from the DrupalPage component.");
      }

      // Now that these props are ready, we save them for later use.
      this.lastAssuredProps = this.props;

      // We need to do a force update, because we can now synchronously load them in the
      // render function.
      this.forceUpdate();
    })().catch(error => {
      // If an error occurs in the data fetching process, we want to throw that error during
      // the render. This way it can be catched by an ErrorBoundry.
      this.setState({ error });
    });
  }

  componentWillUnmount() {
    this.lastRequest = undefined;
  }

  /**
   * This makes sure the data for this url is ready to be rendered.
   */
  static async assureData({ url, site }: { url: string; site: Site }) {
    const uuid = await site.getPage(url);

    return { uuid, pageUuid: uuid };
  }

  render() {
    if (this.state.error) {
      throw this.state.error;
    }

    const canRenderFromProps = this.canRenderFromProps(this.props);

    // If we can't render from props, and we don't want to render while loading data,
    // we return null here. That unmounts the component from the mapper, and the
    // Layout component.
    if (!canRenderFromProps && !this.props.renderWhileLoadingData) {
      return null;
    }

    // If we can render based on the props, we do.
    // Otherwise, we get the last known loaded props from the component.
    const data = canRenderFromProps ? this.props : this.lastAssuredProps;

    // Is there isn't any data available to render (also not from before), we can only
    // render the layout.
    if (!data) {
      const PropLayout = this.props.layout as React.ComponentType<any>;
      if (this.props.layout) {
        return (
          <PropLayout
            loadingData
            url={null}
            page={null}
            {...this.props.layoutProps}
          />
        );
      }

      // If there isn't a layout, we render nothing.
      return null;
    }

    const uuid = this.props.site.getUuid(data.url);

    const entityMapper = (
      <EntityMapper
        mapper={data.mapper as any}
        uuid={uuid}
        asyncMapper={data.asyncMapper as any}
        entityProps={{
          ...data.pageProps,
          page: data.site.getData(uuid),
        }}
      />
    );

    const Layout = this.props.layout;
    if (!Layout) {
      return entityMapper;
    }

    return (
      <Layout
        loadingData={!canRenderFromProps}
        url={data.url}
        page={data.site.getData(uuid)}
        {...data.layoutProps}
      >
        {entityMapper}
      </Layout>
    );
  }

  static propTypes = {
    asyncMapper: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    ]),
    layout: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    layoutProps: PropTypes.shape({}),
    mapper: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    pageProps: PropTypes.shape({}),
    renderWhileLoadingData: PropTypes.bool,
    url: PropTypes.string.isRequired,
  };

  static defaultProps = {
    layout: undefined,
    layoutProps: {},
    pageProps: undefined,
    renderWhileLoadingData: false,
  };
}

export interface DrupalPageOwnProps {
  layout?: React.ReactType;
  layoutProps?: object;
  pageProps?: object;
  renderWhileLoadingData?: boolean;
  url: string;
}

type DrupalPageInnerProps = DrupalPageProps & { site: Site };
type DrupalPageProps = DrupalPageOwnProps & EntityMapperPropsMapper;

const DrupalPageWrapper = React.forwardRef<DrupalPage, DrupalPageProps>(
  (props, ref) => (
    <SiteConsumer>
      {site => <DrupalPage {...props} site={site} ref={ref} />}
    </SiteConsumer>
  ),
);

export const assureData = DrupalPage.assureData;

export default DrupalPageWrapper;
