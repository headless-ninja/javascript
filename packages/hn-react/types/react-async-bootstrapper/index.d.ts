declare module 'react-async-bootstrapper' {
  interface AsyncBootstrapperOptions {
    componentWillUnmount?: boolean;
  }

  function asyncBootstrapper(
    reactElement: JSX.Element,
    options: AsyncBootstrapperOptions,
  ): Promise<JSX.Element>;

  export = asyncBootstrapper;
}
