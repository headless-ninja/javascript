// tslint:disable-next-line:import-name
import fetch from 'universal-fetch';
import deepmerge from 'deepmerge';

class Site {

  private url: string;

  private data: object;

  constructor({ url }: {url: string}) {

    this.url = url;

  }

  fetch(options: object): Promise<object> {
    return fetch({
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      ...options,
    }).then(result => result.json());
  }

  getPage({ path }: {path: string}) {
    return this.fetch({ url: this.url + '/hn?_format=hn&path=' + encodeURIComponent(path) })
      .then((page) => {
        this.addData(page);
      });
  }

  private addData(data: object) {
    this.data = deepmerge(this.data, data, { arrayMerge: (a, b) => a.concat(b) });
  }

  getData() {
    return this.data;
  }
}

export default Site;
