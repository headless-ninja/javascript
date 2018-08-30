import * as React from 'react';

export default WrappedComponent => props => (
  <WrappedComponent {...props} hocProps />
);
