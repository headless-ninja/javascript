import Document from 'next/document'
import site from './site';

export default class MyDocument extends Document {

  constructor (props) {
    super(props);
    console.log(props);
    props.__NEXT_DATA__.HN_DATA = site.data;
  }
}
