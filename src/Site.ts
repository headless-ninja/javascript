import { polyfill } from 'es6-promise';
import 'isomorphic-fetch';
import * as deepmerge from 'deepmerge';
import * as getNested from 'get-nested';
import { stringify } from 'query-string';
import SiteInitializeParams from './SiteInitializeParams';

polyfill();

class Site {

  private initialized: boolean = false;
  private url: string;

  private tokensToVerify: string[] = [];
  private user: string;
  private data = {
    data: {},
    paths: {},
  };

  private pagesLoading = {};

  constructor(initParams?: SiteInitializeParams) {
    if (initParams) this.initialize(initParams);
  }

  initialize({ url }: SiteInitializeParams) {
    this.initialized = true;
    this.url = url;
  }

  fetch(path, options = {}): Promise<object> {
    if (!this.initialized) {
      throw Error('Site is not intitialized. Pass an object when creating a site, or use the ' +
        'initialize method.');
    }
    return fetch(this.url + path, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      ...options,
    })
      .then((response) => {
        if (!response.ok) {
          throw Error(`Error at path: ${path}\n\n${response.statusText}`);
        }
        return response.json();
      });
  }

  getPage(path, loadFromServer = false): Promise<void> {
    if (loadFromServer === true || !this.pagesLoading[ path ]) {

      // Copy this.tokensToVerify for this single request.
      const tokensToVerify = [...this.tokensToVerify];

      this.pagesLoading[ path ] = this.fetch('/hn?' + stringify({
        path,
        _format: 'hn',
        _hn_user: this.user ? this.user : undefined,
        _hn_verify: tokensToVerify,
      }))
        .then((page: Response) => {

          // Get the user id, to pass to all new requests.
          this.user = getNested(() => page['__hn'].request.user, this.user);

          // Remove all sent tokens from the tokensToVerify.
          this.tokensToVerify = this.tokensToVerify.filter(t => tokensToVerify.indexOf(t) === -1);

          // Add new token to tokensToVerify.
          const newToken = getNested(() => page['__hn'].request.token);
          if (newToken) this.tokensToVerify.push(newToken);

          // Add all data to the global data storage.
          this.addData(page);

        })
        .catch((error) => {
          // console.error(error);
          this.addData({
            paths: {
              [path]: '500',
            },
          });
        });
    }
    return this.pagesLoading[ path ].then(() => this.data.paths[ path ]);
  }

  private addData(data: object) {
    this.data = deepmerge(this.data, data, { arrayMerge: (a, b) => b });
  }

  getData(key) {
    return this.data.data[ key ];
  }

  /**
   * * Translate ninja
   * Get the translations from the settings block.
   * Gets the language from context, or from parameter if overruled.
   * Returns input string when no translations are available.
   * @param string
   * @param langCode
   * @return {*}
   */
  // tslint:disable-next-line function-name
  t(string, langCode) {
    const settings = this.getData('settings');
    const path = this.data.paths[window.location.pathname];
    const lang = langCode || getNested(() => this.getData(path).langcode, 'en');
    return getNested(() => settings.translations[string][lang], string);
  }
}

export default Site;
