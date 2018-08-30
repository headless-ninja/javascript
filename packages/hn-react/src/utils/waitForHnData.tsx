import * as PropTypes from 'prop-types';
import * as React from 'react';

const asyncBootstrapper = require('react-async-bootstrapper'); // tslint:disable-line:no-var-requires

export default async function(children) {
  const context = {
    state: {
      drupalPage: null,
      entities: [],
    },
  };

  class DrupalPageContextProvider extends React.Component {
    static childContextTypes = {
      hnContext: PropTypes.object,
    };

    getChildContext() {
      return { hnContext: context };
    }

    render() {
      return React.Children.only(this.props.children);
    }
  }

  const drupalContextProvider = (
    <DrupalPageContextProvider>{children}</DrupalPageContextProvider>
  );

  await asyncBootstrapper(drupalContextProvider, {
    componentWillUnmount: true,
  });

  return drupalContextProvider;
}
