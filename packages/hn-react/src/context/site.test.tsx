import { Site } from 'hn';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import site from '../utils/site';
import { SiteConsumer, SiteProvider, withSite } from './site';

describe('SiteConsumer', async () => {
  test('with default site', async () => {
    let renderedSite;

    renderer.create(
      <SiteConsumer>
        {consumedSite => {
          renderedSite = consumedSite;
          return null;
        }}
      </SiteConsumer>,
    );

    expect(renderedSite).toBe(site);
  });

  test('with SiteProvider', async () => {
    const newSite = new Site();

    let renderedSite;

    renderer.create(
      <SiteProvider site={newSite}>
        <SiteConsumer>
          {consumedSite => {
            renderedSite = consumedSite;
            return null;
          }}
        </SiteConsumer>
      </SiteProvider>,
    );

    expect(renderedSite).toBe(newSite);
  });
});

describe('withSite', async () => {
  test('as function', async () => {
    let renderedSite;

    // Another prop, testNumber, is added to make sure typechecking works
    // correctly.
    const Consumer = withSite(
      ({
        site: consumedSite,
        testNumber,
      }: {
        site: Site;
        testNumber: number;
      }) => {
        renderedSite = consumedSite;
        return null;
      },
    );

    renderer.create(<Consumer testNumber={3} />);

    expect(renderedSite).toBe(site);
  });

  test('as decorator', async () => {
    let renderedSite;

    // The decorator doesn't work with Typescript typings, because it changes
    // the class that's returned. That's why there are ts-ignores in this test.
    //
    // See issues Microsoft/TypeScript#4881 and
    // DefinitelyTyped/DefinitelyTyped#9951 for more information.

    // @ts-ignore
    @withSite
    // @ts-ignore
    class Consumer extends React.Component<{ site: Site }> {
      render() {
        renderedSite = this.props.site;
        return null;
      }
    }

    // @ts-ignore
    renderer.create(<Consumer />);

    expect(renderedSite).toBe(site);
  });
});
