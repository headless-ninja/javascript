import React, { Component } from 'react';
import { parse } from 'url';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import site from './site';

export default class extends Component {
  static async getInitialProps({ asPath }) {
    const location = parse(asPath, true);
    const page = await site.getPage(asPath, true);

    return {
      location,
      page
    };
  }

  static propTypes = {
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
    layout: 'div',
    asyncMapper: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      contentType: null,
    };

    this.contentTypes = {};
  }

  componentWillMount() {
    this.saveComponent(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.saveComponent(nextProps);
  }

  saveComponent(props) {
    const { mapper, asyncMapper } = props;
    const page = site.getData(props.page);
    const bundle = `${page.__hn.entity.type}__${page.__hn.entity.bundle}`;

    const ContentType = (typeof mapper === 'object' && page.type) ? mapper[bundle] : mapper(page, bundle);

    if(!ContentType) {
      console.error('Component for content type', bundle, 'not found.');
      return null;
    }

    if(asyncMapper) {
      this.setState({ loading: true });
      ContentType().then(module => {
        this.contentTypes[bundle] = module.default || module;
        this.setState({
          contentType: bundle,
          loading: false,
        });
      });
    } else {
      this.contentTypes[bundle] = ContentType;
      this.setState({ contentType: bundle });
    }
  }

  render() {
    const Layout = this.props.layout;

    const page = site.getData(this.props.page);

    const ContentType = this.contentTypes[this.state.contentType];

    if(!ContentType) {
      return null;
    }

    return (
      <Layout
        page={page}
        location={this.props.location}
        history={this.props.history}
      >
        <ContentType page={page} />
      </Layout>
    );
  }
}
