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
  };

  static defaultProps = {
    layout: 'div',
  };

  render() {
    const mapper = this.props.mapper;

    const Layout = this.props.layout;

    const page = site.getData(this.props.page);

    if(typeof getNested(() => page.type.target_id) !== 'string') {
      return null;
    }

    const ContentType = (typeof mapper === 'object') ? mapper[page.type.target_id] : mapper(page.type.target_id);

    if(!ContentType) {
      console.error('Component for content type', page.type.target_id, 'not found.');
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
