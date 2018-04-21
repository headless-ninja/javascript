import React from 'react';
import HOC from './HOC';

export default HOC(props => (
  <div className="MyCustomMapperComponentWithHOC2" {...props} />
));
