declare module 'react-async-bootstrapper' {

  interface AsyncBootstrapperOptions {
    componentWillUnmount?: boolean;
  }

  export default function asyncBootstrapper(
    reactElement: JSX.Element,
    options: AsyncBootstrapperOptions,
  ): Promise<JSX.Element>;

}
