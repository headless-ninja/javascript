import React, { Component } from 'react';
import { parse } from 'url';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import site from '../site';

const components = new Map();

export default class DrupalPage extends Component {
  static propTypes = {
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
  };

  static defaultProps = {
    layout: 'div',
    asyncMapper: false,
    layoutProps: {},
    renderWhileLoadingData: false,
  };

  static contextTypes = {
    hnContext: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      loadingData: true,
      dataUrl: null,
      pageUuid: null,
      contentTypeComponentSymbol: null,
    };
  }

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
   * @returns {Promise.<{pageUuid: void, contentTypeComponentSymbol: Symbol}>}
   */
  static async assureData({ url, mapper, asyncMapper }) {
    // Get the page. If the page was already fetched before, this should be instant.
    const pageUuid = await site.getPage(url);
    if(!pageUuid) {
      throw Error('An error occurred getting a response from the server.');
    }

    // This gets the data from the site, based on the uuid.
    const data = site.getData(pageUuid);

    // This should give back a bundle string, that is used in the mapper.
    const bundle = getNested(() => `${data.__hn.entity.type}__${data.__hn.entity.bundle}`, '_fallback');

    // Get the component that belongs to this content type
    let contentTypeComponent = typeof mapper === 'function' ? mapper(data, bundle) : mapper[bundle];

    // If asyncMapper is true, execute the function so it returns a promise.
    if(asyncMapper && typeof contentTypeComponent === 'function') {
      contentTypeComponent = contentTypeComponent();
    }

    // If a promise was returned, resolve it.
    if(contentTypeComponent && typeof contentTypeComponent.then !== 'undefined') {
      contentTypeComponent = await contentTypeComponent;
    }

    // Make sure there is a contentComponent.
    if(!contentTypeComponent) {
      throw Error('No content type found');
    }

    // If it has a .default (ES6+), use that.
    if(contentTypeComponent.default) {
      contentTypeComponent = contentTypeComponent.default;
    }

    // Store the contentTypeComponent globally, so it can be rendered sync.
    const contentTypeComponentSymbol = Symbol.for(contentTypeComponent);
    components.set(contentTypeComponentSymbol, contentTypeComponent);

    return { pageUuid, contentTypeComponentSymbol };
  }

  componentWillUnmount() {
    this.lastRequest = null;
  };

  lastRequest = null;

  async loadData({ url, mapper, asyncMapper }) {

    const lastRequest = Symbol(url);

    this.lastRequest = lastRequest;

    this.setState({ loadingData: true });

    if(!this.props.renderWhileLoadingData) {
      // Mark this component as not-ready. This unmounts the Layout and old ContentType.
      this.setState({ ready: false });
    }

    // Load the data.
    const { pageUuid, contentTypeComponentSymbol } = await DrupalPage.assureData({ url, mapper, asyncMapper});

    // Check if this is still the last request.
    if(this.lastRequest !== lastRequest) return;

    // Mark this component as ready. This mounts the Layout and new ContentType.
    this.setState({ pageUuid, contentTypeComponentSymbol, ready: true, loadingData: false, dataUrl: url });
  }

  render() {
    // Only render if the component is ready.
    if (!this.state.ready) return null;

    // Get props.
    const Layout = this.props.layout;

    // Get the data and content types with the state properties.
    const data = site.getData(this.state.pageUuid);
    const ContentType = components.get(this.state.contentTypeComponentSymbol);

    return (
      <Layout
        loadingData={this.state.loadingData}
        url={this.state.dataUrl}
        page={data}
        {...this.props.layoutProps}
      >
        <ContentType page={data} />
      </Layout>
    );
  }
}
