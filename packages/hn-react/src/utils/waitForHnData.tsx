import PropTypes from 'prop-types';
import React, { Component } from 'react';
import asyncBootstrapper from 'react-async-bootstrapper';

export default async function(children) {
  const context = {
    state: {
      drupalPage: null,
      entities: [],
    },
  };

  class DrupalPageContextProvider extends Component {
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
