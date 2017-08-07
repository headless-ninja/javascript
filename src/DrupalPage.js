import { Component } from 'react';
import { parse } from 'url';
import site from './site';

export default class extends Component {
  static async getInitialProps ({ asPath }) {
    const location = parse(asPath, true);
    const page = await site.getPage(asPath, true);

    return {
      location,
      page
    };
  }
}
