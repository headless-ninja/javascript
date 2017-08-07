import { DrupalPage, site } from 'hn-react';
site.url = 'http://localhost:8088';

export default class extends DrupalPage {
  render () {
    const data = site.getData(this.props.page);
    if(!data) return null;
    return <div>
      <p>Currently on page {data.uuid}</p>
    </div>
  }
}
