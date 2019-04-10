import { Site } from 'hn';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { SiteConsumer } from '../context/site';

const getNested = require('get-nested'); // tslint:disable-line:no-var-requires

const entityCache = new Map<() => ImportReturn, React.ReactType>();
export const clearEntityCache = () => entityCache.clear();

type EntityMapperInnerProps = EntityMapperProps & { site: Site };

export class EntityMapper extends React.Component<
  EntityMapperInnerProps,
  { error: Error | null }
> {
  state = {
    error: null,
  };

  lastAssuredProps: EntityMapperInnerProps | null = null;

  /**
   * If this component exists in a tree that is invoked with the waitForHnData function, this function is invoked.
   * Only after the promise is resolved, the component will be mounted. To keep the data fetched here, we assign the
   * state to the hnContext provided by the DrupalPageContextProvider. This way, the state will be preserved trough
   * multiple renders.
   */
  async bootstrap() {
    // Make sure that if this is an async component, we have it saved in the entity cache.
    return assureComponent(this.props);
  }

  lastRequest: symbol | undefined;

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    /**
     * This function is almost the same as the componentDidUpdate in the DrupalPage.
     * Please check there for more comments, context and reference.
     */
    const lastRequest = (this.lastRequest = Symbol());

    if (this.isReady()) {
      this.lastAssuredProps = this.props;
      return;
    }

    (async () => {
      await assureComponent(this.props);

      if (lastRequest !== this.lastRequest) {
        return;
      }

      // istanbul ignore next
      if (!this.isReady()) {
        throw new Error('The component cannot be loaded.');
      }

      this.lastAssuredProps = this.props;

      this.forceUpdate();
    })().catch(error => {
      this.setState({ error });
    });
  }

  componentWillUnmount() {
    this.lastRequest = undefined;
  }

  isReady(props = this.props) {
    return typeof getComponentFromMapper(props) !== 'undefined';
  }

  render() {
    /**
     * This render function is also almost the same technique as the DrupalPage render.
     * Please check that function for comments.
     */
    if (this.state.error) {
      throw this.state.error;
    }

    const canRenderFromProps = this.isReady();

    const props = canRenderFromProps ? this.props : this.lastAssuredProps;

    if (!props) {
      return null;
    }

    const EntityComponent = getComponentFromMapper(props);

    if (EntityComponent === null) {
      return null;
    }

    // istanbul ignore next
    if (!EntityComponent) {
      throw new Error(
        "We received data that we can't render. This shouldn't be possible.",
      );
    }

    const data = props.site.getData(props.uuid);

    return (
      <EntityComponent
        bundle={getBundle(data)}
        paragraph={data}
        entity={data}
        {...props.entityProps}
      />
    );
  }

  static propTypes = {
    asyncMapper: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]),
    ]),
    entityProps: PropTypes.shape({}),
    mapper: PropTypes.oneOfType([
      PropTypes.shape({}),
      PropTypes.func,
      PropTypes.bool,
    ]),
    uuid: PropTypes.string.isRequired,
  };

  static defaultProps = {
    asyncMapper: false,
    entityProps: {},
    mapper: false,
  };
}

export type ImportReturnResolved =
  | React.ReactType
  | { default: React.ReactType };
export type ImportReturn = Promise<ImportReturnResolved>;

export interface ObjectMapper {
  [uuid: string]: React.ReactType;
}
export interface ObjectMapperAsync {
  [uuid: string]: () => ImportReturn;
}

export type functionMapper = (
  entity: object,
  bundle: string,
) => React.ReactType;
export type functionMapperAsync = (
  entity: object,
  bundle: string,
) => () => ImportReturn;

export type mapperType =
  | ObjectMapper
  | ObjectMapperAsync
  | functionMapper
  | functionMapperAsync;

export interface EntityMapperPropsBase {
  entityProps?: object;
  uuid: string;
}

export interface EntityMapperPropsMapperAsync {
  mapper?: undefined;
  asyncMapper: ObjectMapperAsync | functionMapperAsync;
}

export interface EntityMapperPropsMapperAsyncClassic {
  mapper: ObjectMapperAsync | functionMapperAsync;
  asyncMapper: true;
}

export interface EntityMapperPropsMapperSync {
  mapper: ObjectMapper | functionMapper;
  asyncMapper?: false;
}

export type EntityMapperPropsMapper =
  | EntityMapperPropsMapperAsync
  | EntityMapperPropsMapperAsyncClassic
  | EntityMapperPropsMapperSync;

export type EntityMapperProps = EntityMapperPropsBase & EntityMapperPropsMapper;

const EntityMapperWrapper = React.forwardRef<EntityMapper, EntityMapperProps>(
  (props, ref) => (
    <SiteConsumer>
      {site => <EntityMapper {...props} site={site} ref={ref} />}
    </SiteConsumer>
  ),
);

export default EntityMapperWrapper;

/**
 * This gets a component from some mapper data.
 * This can also be a promise resolving to a component.
 */
function getComponentOrPromiseFromMapper(
  props: EntityMapperInnerProps,
):
  | { type: 'component'; value: undefined | React.ReactType }
  | { type: 'promise'; value: undefined | (() => ImportReturn) } {
  // This gets the entity from the site, based on the uuid.
  const entity = props.site.getData(props.uuid);

  // This should give back a bundle string, that is used in the mapper.
  const bundle = getBundle(entity);

  // If it's not an async mapper, we can just use the 'mapper' prop.
  if (!props.asyncMapper) {
    return {
      type: 'component',
      value:
        typeof props.mapper === 'function'
          ? props.mapper(entity, bundle)
          : props.mapper[bundle],
    };
  }

  // We check which style of the mapper it is.
  const entityComponentMapper =
    props.asyncMapper === true ? props.mapper : props.asyncMapper;
  const entityComponentResult =
    typeof entityComponentMapper === 'function'
      ? entityComponentMapper(entity, bundle)
      : entityComponentMapper[bundle];

  return {
    type: 'promise',
    value: entityComponentResult,
  };
}

/**
 * This makes sure the data for this url is ready to be rendered.
 */
export async function assureComponent(props: EntityMapperInnerProps) {
  const component = getComponentOrPromiseFromMapper(props);

  // If it's not a promise, return.
  // Nothing to assure.
  if (component.type === 'component') {
    return;
  }

  // If no value was returned from the mapper, we can't assure the component.
  if (!component.value) {
    return;
  }

  // Check if we already cached this component.
  if (entityCache.has(component.value)) {
    return;
  }

  // If not, we get this entity now.
  const entityComponentResult = await component.value();

  // We save the entity in the cache.
  if (
    typeof entityComponentResult === 'object' &&
    typeof entityComponentResult.default !== 'undefined'
  ) {
    entityCache.set(component.value, entityComponentResult.default);
  } else {
    entityCache.set(component.value, entityComponentResult as React.ReactType);
  }
}

/**
 * Returns the component if it is availible right now.
 * Returns null if the component isn't available, and never will be.
 * Returns undefined if the component isn't available, but maybe will be in the future.
 */
export function getComponentFromMapper(
  props: EntityMapperInnerProps,
): React.ReactType | null | undefined {
  const entityComponent = getComponentOrPromiseFromMapper(props);

  if (
    entityComponent.type === 'promise' &&
    typeof entityComponent.value !== 'undefined'
  ) {
    return entityCache.get(entityComponent.value);
  }
  if (entityComponent.type === 'component') {
    return entityComponent.value || null;
  }
  return null;
}

function getBundle(entity) {
  return getNested(
    () => `${entity.__hn.entity.type}__${entity.__hn.entity.bundle}`,
    '_fallback',
  );
}
