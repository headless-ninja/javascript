import { polyfill } from 'es6-promise';
import 'isomorphic-fetch';
import * as deepmerge from 'deepmerge';
import * as getNested from 'get-nested';

polyfill();

class Site {

  private url: string;

  private data = {
    data: {},
    paths: {},
  };

  private pagesLoading = {};

  constructor({ url }: { url: string }) {
    this.url = url;
  }

  reset(url = this.url, data = { data: {}, paths: {} }, pagesLoading = {}) {
    this.url = url;
    this.data = data;
    this.pagesLoading = pagesLoading;
  }

  fetch(path, options = {}): Promise<object> {
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
      this.pagesLoading[ path ] = this.fetch('/hn?_format=hn&path=' + encodeURIComponent(path))
        .then((page: Response) => {
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