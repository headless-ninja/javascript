import getNested from 'get-nested';
import PropTypes from 'prop-types';
import React, { Component, ReactType } from 'react';
import site from '../utils/site';

class EntityMapper extends React.Component<
  EntityMapperProps,
  EntityMapperState
> {
  static entityComponents = [];

  static contextTypes = {
    hnContext: PropTypes.object,
  };

  /**
   * This makes sure the data for this url is ready to be rendered.
   */
  static async assureComponent({ uuid, mapper, asyncMapper }) {
    // This gets the entity from the site, based on the uuid.
    const entity = site.getData(uuid);

    // This should give back a bundle string, that is used in the mapper.
    const bundle = EntityMapper.getBundle(entity);

    // Get the component that belongs to this entity type
    let entityComponent =
      typeof mapper === 'function' ? mapper(entity, bundle) : mapper[bundle];

    // If asyncMapper is true, execute the function so it returns a promise.
    if (asyncMapper && typeof entityComponent === 'function') {
      entityComponent = entityComponent();
    }

    // If a promise was returned, resolve it.
    if (entityComponent && typeof entityComponent.then !== 'undefined') {
      entityComponent = await entityComponent;
    }

    // Make sure there is an entityComponent.
    if (!entityComponent) {
      return;
    }

    // If it has a .default (ES6+), use that.
    if (entityComponent.default) {
      entityComponent = entityComponent.default;
    }

    // Store the entityComponent globally, so it can be rendered sync.
    EntityMapper.entityComponents.push({
      mapper,
      uuid,
      component: entityComponent,
    });
  }

  static getBundle = entity =>
    getNested(
      () => `${entity.__hn.entity.type}__${entity.__hn.entity.bundle}`,
      '_fallback',
    );

  /**
   * Use this method to get a final mapper, based on both the asyncMapper & mapper prop.
   * This ensures backwards compatibility.
   */
  static getMapperFromProps = ({ asyncMapper, mapper }) =>
    typeof asyncMapper === 'boolean' ? mapper : asyncMapper;

  constructor(props) {
    super(props);

    this.state = {
      entityProps: props.entityProps,
      mapper: EntityMapper.getMapperFromProps(props),
      ready: false,
      uuid: props.uuid,
    };
  }

  /**
   * If this component exists in a tree that is invoked with the waitForHnData function, this function is invoked.
   * Only after the promise is resolved, the component will be mounted. To keep the data fetched here, we assign the
   * state to the hnContext provided by the DrupalPageContextProvider. This way, the state will be preserved trough
   * multiple renders.
   */
  async asyncBootstrap() {
    const { asyncMapper } = this.props;
    const { uuid, entityProps, mapper } = this.state;

    // If this mapper + uuid combination is already in state, use that state
    const state = getNested(
      () =>
        this.context.hnContext.state.entities.find(
          e => e.mapper === mapper && e.uuid === uuid,
        ).componentState,
    );

    if (state) {
      return true;
    }

    this.context.hnContext.state.entities.push({
      mapper,
      uuid,
      componentState: await this.loadComponent({
        asyncMapper,
        entityProps,
        mapper,
        uuid,
      }),
    });
    return true;
  }

  /**
   * The first time this element is rendered, we always make sure the component and the Drupal page is loaded.
   */
  componentWillMount() {
    const { uuid, asyncMapper, entityProps } = this.props;
    const { mapper } = this.state;
    const state = getNested(
      () =>
        this.context.hnContext.state.entities.find(
          e => e.mapper === mapper && e.uuid === uuid,
        ).componentState,
    );

    if (state) {
      this.setState(state);
    } else {
      this.loadComponent({
        uuid,
        asyncMapper,
        entityProps,
        mapper: EntityMapper.getMapperFromProps({ asyncMapper, mapper }),
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadComponent({
      ...nextProps,
      mapper: EntityMapper.getMapperFromProps(nextProps),
    });
  }

  async loadComponent({ uuid, mapper, asyncMapper, entityProps }) {
    // Check if component for combination of mapper + uuid already was loaded
    const entityComponent = EntityMapper.entityComponents.find(
      c => c.mapper === mapper && c.uuid === uuid,
    );

    // If component isn't loaded yet, go load it
    if (!entityComponent) {
      this.setState({ ready: false });

      await EntityMapper.assureComponent({
        asyncMapper,
        mapper,
        uuid,
      });
    }

    const newState = {
      ...this.state,
      entityProps,
      mapper,
      uuid,
      ready: true,
    };

    this.setState(newState);

    return newState;
  }

  isReady() {
    return this.state.ready;
  }

  render() {
    const { uuid, entityProps, mapper } = this.state;

    const entity = site.getData(uuid);

    if (!entity) {
      return null;
    }

    const EntityComponent = getNested(
      () =>
        EntityMapper.entityComponents.find(
          c => c.uuid === uuid && c.mapper === mapper,
        ).component,
    );

    if (!EntityComponent) {
      return null;
    }

    return (
      <EntityComponent
        bundle={EntityMapper.getBundle(entity)}
        paragraph={entity}
        entity={entity}
        {...entityProps}
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

interface ObjectMapper {
  [uuid: string]: ReactType;
}
interface ObjectMapperAsync {
  [uuid: string]: () => Promise<ReactType>;
}

type functionMapper = (entity: object) => ReactType;
type functionMapperAsync = (entity: object) => Promise<ReactType>;

interface EntityMapperPropsBase {
  entityProps?: object;
  uuid: string;
}

export interface EntityMapperPropsAsync extends EntityMapperPropsBase {
  asyncMapper: ObjectMapperAsync | functionMapperAsync;
}

export interface EntityMapperPropsAsyncClassic extends EntityMapperPropsBase {
  mapper: ObjectMapperAsync | functionMapperAsync;
  asyncMapper: true;
}

export interface EntityMapperPropsSync extends EntityMapperPropsBase {
  mapper: ObjectMapper | functionMapper;
  asyncMapper?: false;
}

export type EntityMapperProps =
  | EntityMapperPropsAsync
  | EntityMapperPropsAsyncClassic
  | EntityMapperPropsSync;

interface EntityMapperState {
  entityProps: object;
  mapper: any;
  ready: boolean;
  uuid: string;
}

export default EntityMapper;
