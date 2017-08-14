import { Site } from 'hn';
import getNested from 'get-nested';

const site = new Site({ url: '' });

if(getNested(() => window.__NEXT_DATA__.HN_DATA)) {
  site.data = window.__NEXT_DATA__.HN_DATA;
  site.url = window.__NEXT_DATA__.HN_URL || site.url;
  site.pagesLoading = {
    [window.location.pathname]: Promise.resolve(),
  };
}

export default site;
