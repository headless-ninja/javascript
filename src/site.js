import { Site } from 'hn';

const site =  new Site({url: 'http://localhost:8088'});

if(typeof window !== 'undefined') {
  site.data = window.__NEXT_DATA__.HN_DATA;
}

export default site;
