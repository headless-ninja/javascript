import React, { Component } from 'react';
import { parse } from 'url';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import site from '../site';

const components = new Map();

export default class extends Component {
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
  };

  static defaultProps = {
    page: null,
    layout: 'div',
    asyncMapper: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      pageUuid: null,
      contentTypeComponentSymbol: null,
    };
  }

  componentWillMount() {
    this.loadData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.loadData(nextProps);
  }

  async loadData({ page, url, mapper, asyncMapper }) {

    // Mark this component as not-ready.
    this.setState({ ready: false, pageUuid: null, contentTypeComponentSymbol: null });

    // Get the page. If the page was already fetched before, this should be instant.
    const pageUuid = await site.getPage(url || page);
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

    // Mark this component as ready.
    this.setState({ pageUuid, contentTypeComponentSymbol, ready: true });
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
      <Layout page={data}>
        <ContentType page={data} />
      </Layout>
    );
  }
}
