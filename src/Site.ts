import { polyfill } from 'es6-promise';
import 'isomorphic-fetch';
import * as deepmerge from 'deepmerge';

polyfill();

class Site {

  private url: string;

  private data = {
    data: {},
    paths: {},
  };

  private pagesLoading = {};

  constructor({ url }: {url: string}) {

    this.url = url;

  }

  fetch(path, options = {}): Promise<object> {
    return fetch(this.url + path, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      ...options,
    })
      .then(result => result.json());
  }

  getPage(path, loadFromServer = false): Promise<void> {

    if (loadFromServer === true || !this.pagesLoading[path]) {
      this.pagesLoading[path] = this.fetch('/hn?_format=hn&path=' + encodeURIComponent(path))
        .then((page) => {
          this.addData(page);
        })
        .catch((error) => {
          console.error(error);
          this.addData({
            paths: {
              [path]: '500',
            },
          });
        });
    }
    return this.pagesLoading[path].then(() => this.data.paths[path]);
  }

  private addData(data: object) {
    this.data = deepmerge(this.data, data, { arrayMerge: (a, b) => a.concat(b) });
  }

  getData(key) {
    return this.data.data[key];
  }
}

export default Site;
