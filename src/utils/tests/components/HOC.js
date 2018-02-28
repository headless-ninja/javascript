import React from 'react';

export default WrappedComponent => props => (
  <WrappedComponent {...props} hocProps={true} />
);
