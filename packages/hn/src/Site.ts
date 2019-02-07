import 'isomorphic-fetch';
import { stringify } from 'query-string';
import HnServerResponse, { HnData } from './HnServerResponse';
import SiteInitializeParams from './SiteInitializeParams';
const getNested = require('get-nested'); // tslint:disable-line:no-var-requires
const deepmerge = require('deepmerge/dist/umd'); // tslint:disable-line:no-var-requires

const propertiesToHydrate = ['tokensToVerify', 'user', 'data'];

class Site {
  private initialized: boolean = false;

  // Created when initializing
  private url: string | null = null;
  private fetchOptions: RequestInit = {};

  // Can be hydrated and dehydrated
  private tokensToVerify: string[] = [];
  private user: string | null = null;
  private data: HnData = {
    data: {},
    paths: {},
    __hn: {},
  };

  // Not hydrated
  private pagesLoading: { [s: string]: Promise<string> } = {};
  private pagesLoaded: { [s: string]: string } = {};

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
      __hn: {},
    };
    this.pagesLoading = {};
    this.pagesLoaded = {};
  }

  /**
   * Creates an object that can be hydrated by the hydrate function.
   */
  dehydrate(): object {
    const dehydrated = {};
    propertiesToHydrate.forEach(property => {
      dehydrated[property] = this[property];
    });
    return dehydrated;
  }

  /**
   * Updates all properties with the object created by the dehydrate function.
   */
  hydrate(options: object): void {
    propertiesToHydrate.forEach(property => {
      this[property] = options[property];
    });
  }

  private fetch(path, options = {}): Promise<any> {
    if (!this.initialized) {
      throw Error(
        'Site is not intitialized. Pass an object when creating a site, or use the ' +
          'initialize method.',
      );
    }
    return fetch(this.url + path, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      ...options,
      ...this.fetchOptions,
    }).then(response => {
      if (!response.ok) {
        throw Error(
          `Error at path: ${this.url + path}: ${response.status} - ${
            response.statusText
          }`,
        );
      }
      return response.json();
    });
  }

  public getPage(path, loadFromServer = false): Promise<string> {
    if (!loadFromServer) {
      const uuid = this.getUuid(path);

      // If we already loaded the page (either directly or via another page),
      // we can return it right now.
      if (uuid) return Promise.resolve(uuid);

      // If we're already loading this page, we should return the promise.
      if (this.pagesLoading[path]) return this.pagesLoading[path];
    }

    // Copy this.tokensToVerify for this single request.
    const tokensToVerify = [...this.tokensToVerify];

    this.pagesLoading[path] = this.fetch(
      '/hn?' +
        stringify({
          path,
          _format: 'hn',
          _hn_user: this.user ? this.user : undefined,
          _hn_verify: tokensToVerify,
        }),
    ).then((page: HnServerResponse) => {
      const hnRequestData =
        (page.__hn && page.__hn.request && page.__hn.request) || {};

      // Get the user id, to pass to all new requests.
      this.user = hnRequestData.user || this.user;

      // Remove all sent tokens from the tokensToVerify.
      this.tokensToVerify = this.tokensToVerify.filter(
        t => tokensToVerify.indexOf(t) === -1,
      );

      // Add new token to tokensToVerify.
      const newToken = hnRequestData.token;
      if (newToken) this.tokensToVerify.push(newToken);

      // Add all data to the global data storage.
      this.addData(page);

      // Mark this promise as loaded
      const uuid = this.data.paths[path];
      this.pagesLoaded[path] = uuid;

      // Delete the reference to this promise, because we're not loading anymore.
      delete this.pagesLoading[path];

      return uuid;
    });

    return this.pagesLoading[path];
  }

  public getUuid(path: string) {
    // If we already loaded the page, we can return it right now.
    if (this.pagesLoaded[path]) return this.pagesLoaded[path];

    // Maybe we already have the data from another fetch.
    try {
      // We try to get the data directly. If the data isn't available, that's fine.
      const uuid = this.data.paths[path];
      if (this.getData(uuid).__hn.view_modes.includes('default')) {
        return uuid;
      }
    } catch {
      // The data probabily doesn't exist yet, so we do nothing.
    }
  }

  private addData(data: HnServerResponse) {
    this.data = deepmerge(this.data, data, { arrayMerge: ({}, b) => b });
  }

  public getData(key) {
    return this.data.data[key];
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
  public t(string, langCode?) {
    const settings = this.getData('settings');
    const path = this.data.paths[window.location.pathname];
    const lang = langCode || getNested(() => this.getData(path).langcode, 'en');
    return getNested(() => settings.translations[string][lang], string);
  }
}

export default Site;
