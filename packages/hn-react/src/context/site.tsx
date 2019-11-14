import { Site } from 'hn';
import * as React from 'react';
import globalSite from '../utils/site';

// Create a new context.
const HnContext = React.createContext(globalSite);
const { Consumer, Provider } = HnContext;

// The site provider is the same as the 'Provider', but changes 'site' to
// 'value'.
export const SiteProvider = ({
  site,
  children,
}: {
  site: Site;
  children: React.ReactNode;
}) => <Provider value={site} children={children} />;

// The consumer is exported as both Site and SiteConsumer. The SiteConsumer can
// be used if also the Site from 'hn' is imported, so the names don't overlap.
export { Consumer as Site, Consumer as SiteConsumer };

// There is also a HOC withSite that adds the site to the props of the
// component. Source of the HOC for Typescript:
// https://stackoverflow.com/a/50613946/1907875
export interface InjectedSiteProps {
  site: Site;
}

export function withSite<P extends InjectedSiteProps>(
  Component: React.ComponentType<P>,
) {
  const WrappedComponent: any = Component;
  return function ComponentWithSite(
    props: Pick<P, Exclude<keyof P, keyof InjectedSiteProps>>,
  ) {
    return (
      <Consumer>{site => <WrappedComponent {...props} site={site} />}</Consumer>
    );
  };
}

export function useHnSite(): Site {
  // @ts-ignore
  return React.useContext(HnContext);
}
