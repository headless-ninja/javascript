import React, { Fragment, Component } from 'react';
import { parse } from 'url';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import site from '../site';
import EntityMapper from '../EntityMapper';

class DrupalPage extends Component {
  static contextTypes = {
    hnContext: PropTypes.object,
  };

  state = {
    ready: false,
    loadingData: true,
    dataUrl: null,
    pageUuid: null,
  };

  /**
   * If this component exists in a tree that is invoked with the waitForHnData function, this function is invoked.
   * Only after the promise is resolved, the component will be mounted. To keep the data fetched here, we assign the
   * state to the hnContext provided by the DrupalPageContextProvider. This way, the state will be preserved trough
   * multiple renders.
   */
  async asyncBootstrap() {
    await this.loadData(this.props);
    this.context.hnContext.state = this.state;
  }

  /**
   * The first time this element is rendered, we always make sure the component and the Drupal page is loaded.
   */
  componentWillMount() {
    const state = getNested(() => this.context.hnContext.state);
    if (state) {
      this.setState(state);
    } else {
      this.loadData(this.props);
    }
  }

  /**
   * As soon as the url, mapper or asyncMapper props change, we want to load new data.
   * This always unmounts and mounts all children (Layout and ContentType).
   */
  componentWillReceiveProps(nextProps) {
    if(this.props.url !== nextProps.url || this.props.mapper !== nextProps.mapper || this.props.asyncMapper !== nextProps.asyncMapper) {
      this.loadData(nextProps);
    }
  }

  /**
   * This makes sure the data for this url is ready to be rendered.
   * @param url
   * @param mapper
   * @param asyncMapper
   * @returns {Promise.<{pageUuid: string}>}
   */
  static async assureData({ url, mapper, asyncMapper }) {
    // Get the page. If the page was already fetched before, this should be instant.
    const pageUuid = await site.getPage(url);
    if(!pageUuid) {
      throw Error('An error occurred getting a response from the server.');
    }

    return { pageUuid };
  }

  componentWillUnmount() {
    this.lastRequest = null;
  };

  lastRequest = null;

  async loadData({ url, mapper, asyncMapper }) {

    const lastRequest = Symbol(url);

    this.lastRequest = lastRequest;

    this.setState({ loadingData: true });

    // Load the data.
    const { pageUuid } = await DrupalPage.assureData({ url, mapper, asyncMapper});

    // Check if this is still the last request.
    if(this.lastRequest !== lastRequest) return;

    // Mark this component as ready. This mounts the Layout and new ContentType.
    this.setState({ pageUuid, loadingData: false, dataUrl: url });
  }

  render() {
    // Mark this component as not-ready. This unmounts the Layout and old ContentType.
    // Only render if the component is ready.
    if (this.entity && !this.props.renderWhileLoadingData && !this.entity.isReady()) return null;

    // Get props.
    const Layout = this.props.layout;

    // Get the data and content types with the state properties.
    const data = site.getData(this.state.pageUuid);

    return (
      <Layout
        loadingData={this.state.loadingData}
        url={this.state.dataUrl}
        page={data}
        {...this.props.layoutProps}
      >
        <EntityMapper
          mapper={this.props.mapper}
          uuid={this.state.pageUuid}
          asyncMapper={this.props.asyncMapper}
          entityProps={{ ...this.props.pageProps, page: data }}
          ref={(c) => { this.entity = c; }}
        />
      </Layout>
    );
  }
}

DrupalPage.propTypes = {
  url: PropTypes.string.isRequired,
  layout: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.string,
  ]),
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  asyncMapper: PropTypes.bool,
  layoutProps: PropTypes.shape(),
  renderWhileLoadingData: PropTypes.bool,
  pageProps: PropTypes.shape(),
};

DrupalPage.defaultProps = {
  layout: Fragment,
  asyncMapper: undefined,
  layoutProps: {},
  renderWhileLoadingData: false,
  pageProps: undefined,
};

export default DrupalPage;
