import React, { Component } from 'react';
import asyncBootstrapper from 'react-async-bootstrapper';
import PropTypes from 'prop-types';

export default async function(children) {
  const context = {
    state: {
      drupalPage: null,
      entities: [],
    },
  };

  class DrupalPageContextProvider extends Component {
    getChildContext() {
      return { hnContext: context };
    }

    render() {
      return React.Children.only(this.props.children);
    }
  }

  DrupalPageContextProvider.childContextTypes = {
    hnContext: PropTypes.object,
  };

  const drupalContextProvider = (
    <DrupalPageContextProvider>{children}</DrupalPageContextProvider>
  );

  await asyncBootstrapper(drupalContextProvider, {
    componentWillUnmount: true,
  });

  return drupalContextProvider;
}
