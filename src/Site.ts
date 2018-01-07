import { polyfill, Promise } from 'es6-promise';
import 'isomorphic-fetch';
import * as deepmerge from 'deepmerge';
import * as getNested from 'get-nested';
import { stringify } from 'query-string';
import SiteInitializeParams from './SiteInitializeParams';
import HnServerResponse from './HnServerResponse';

polyfill();

const propertiesToHydrate = ['tokensToVerify', 'user', 'data'];

class Site {

  private initialized: boolean;

  // Created when initializing
  private url: string;
  private fetchOptions: RequestInit;

  // Can be hydrated and dehydrated
  private tokensToVerify: string[];
  private user: string;
  private data: HnServerResponse;

  // Not hydrated
  private pagesLoading: {[s: string]: Promise<string>};

  constructor(initParams?: SiteInitializeParams) {
    this.reset();
    if (initParams) this.initialize(initParams);
  }

  initialize({ url, fetchOptions = {} }: SiteInitializeParams) {
    if (this.initialized) throw Error('The site is already initialized.');
    this.initialized = true;
    this.url = url;
    this.fetchOptions = fetchOptions;
  }

  reset() {
    this.initialized = false;
    this.url = null;
    this.tokensToVerify = [];
    this.user = null;
    this.data = {
      data: {},
      paths: {},
    };
    this.pagesLoading = {};
  }

  /**
   * Creates an object that can be hydrated by the hydrate function.
   */
  dehydrate(): object {
    const dehydrated = {};
    propertiesToHydrate.forEach((property) => {
      dehydrated[property] = this[property];
    });
    return dehydrated;
  }

  /**
   * Updates all properties with the object created by the dehydrate function.
   */
  hydrate(options: object): void {
    propertiesToHydrate.forEach((property) => {
      this[property] = options[property];
    });
  }

  private fetch(path, options = {}): Promise<HnServerResponse> {
    if (!this.initialized) {
      throw Error('Site is not intitialized. Pass an object when creating a site, or use the ' +
        'initialize method.');
    }
    return fetch(this.url + path, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      ...options,
      ...this.fetchOptions,
    })
      .then((response) => {
        if (!response.ok) {
          throw Error(
            `Error at path: ${this.url + path}: ${response.status} - ${response.statusText}`,
          );
        }
        return response.json();
      });
  }

  public getPage(path, loadFromServer = false): Promise<string> {
    if (!this.pagesLoading[ path ]) {
      const dataMaybeAlreadyLoaded = getNested(() => this.data.data[this.data.paths[path]]);
      if (getNested(() => dataMaybeAlreadyLoaded.__hn.view_modes.includes('default'))) {
        this.pagesLoading[ path ] = Promise.resolve(this.data.paths[ path ]);
      }
    }

    if (loadFromServer === true || !this.pagesLoading[ path ]) {

      // Copy this.tokensToVerify for this single request.
      const tokensToVerify = [...this.tokensToVerify];

      this.pagesLoading[ path ] = this.fetch('/hn?' + stringify({
        path,
        _format: 'hn',
        _hn_user: this.user ? this.user : undefined,
        _hn_verify: tokensToVerify,
      }))
        .then((page: HnServerResponse) => {

          // Get the user id, to pass to all new requests.
          this.user = getNested(() => page.__hn.request.user, this.user);

          // Remove all sent tokens from the tokensToVerify.
          this.tokensToVerify = this.tokensToVerify.filter(t => tokensToVerify.indexOf(t) === -1);

          // Add new token to tokensToVerify.
          const newToken = getNested(() => page.__hn.request.token);
          if (newToken) this.tokensToVerify.push(newToken);

          // Add all data to the global data storage.
          this.addData(page);

        })
        .catch((error) => {
          console.error(error);
          this.addData({
            paths: {
              [path]: '500',
            },
          });
        })
        .then(() => this.data.paths[ path ]);
    }
    return this.pagesLoading[ path ];
  }

  private addData(data: HnServerResponse) {
    this.data = deepmerge(this.data, data, { arrayMerge: (a, b) => b });
  }

  public getData(key) {
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
  public t(string, langCode) {
    const settings = this.getData('settings');
    const path = this.data.paths[window.location.pathname];
    const lang = langCode || getNested(() => this.getData(path).langcode, 'en');
    return getNested(() => settings.translations[string][lang], string);
  }
}

export default Site;
