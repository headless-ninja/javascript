import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import site from '../utils/site';

class EntityMapper extends Component {
  static entityComponents = new Map();

  static contextTypes = {
    hnContext: PropTypes.object,
  };

  /**
   * This makes sure the data for this url is ready to be rendered.
   * @param uuid
   * @param mapper
   * @param asyncMapper
   * @returns Symbol
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
      return null;
    }

    // If it has a .default (ES6+), use that.
    if (entityComponent.default) {
      entityComponent = entityComponent.default;
    }

    // Store the entityComponent globally, so it can be rendered sync.
    const entityComponentSymbol = Symbol.for(entityComponent);
    EntityMapper.entityComponents.set(entityComponentSymbol, entityComponent);

    return entityComponentSymbol;
  }

  static getBundle = entity =>
    getNested(
      () => `${entity.__hn.entity.type}__${entity.__hn.entity.bundle}`,
      '_fallback',
    );

  constructor(props) {
    super(props);

    this.state = {
      entityComponentSymbol: null,
      entityProps: props.entityProps,
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
    const { mapper, asyncMapper } = this.props;
    const { uuid, entityProps } = this.state;
    this.context.hnContext.state.entities.push({
      component: await this.loadComponent({
        asyncMapper,
        entityProps,
        mapper,
        uuid,
      }),
      mapper,
      uuid,
    });
    return true;
  }

  /**
   * The first time this element is rendered, we always make sure the component and the Drupal page is loaded.
   */
  componentWillMount() {
    const { uuid, mapper } = this.props;
    const state = getNested(
      () =>
        this.context.hnContext.state.entities.find(
          e => e.mapper === mapper && e.uuid === uuid,
        ).component,
    );

    if (state) {
      this.setState(state);
    } else {
      this.loadComponent(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.uuid !== nextProps.uuid ||
      this.props.mapper !== nextProps.mapper ||
      this.props.asyncMapper !== nextProps.asyncMapper
    ) {
      this.loadComponent(nextProps);
    }
  }

  async loadComponent({ uuid, mapper, asyncMapper, entityProps }) {
    this.setState({ ready: false });
    const entityComponentSymbol = await EntityMapper.assureComponent({
      asyncMapper,
      mapper,
      uuid,
    });

    const newState = {
      ...this.state,
      ...{ uuid, entityComponentSymbol, ready: true, entityProps },
    };
    this.setState(newState);

    return newState;
  }

  isReady() {
    return this.state.ready;
  }

  render() {
    const { index } = this.props;
    const { uuid, entityComponentSymbol, entityProps } = this.state;

    const entity = site.getData(uuid);

    if (!entity) {
      return null;
    }

    const EntityComponent = EntityMapper.entityComponents.get(
      entityComponentSymbol,
    );

    if (!EntityComponent) {
      return null;
    }

    return (
      <EntityComponent
        bundle={EntityMapper.getBundle(entity)}
        paragraph={entity}
        entity={entity}
        index={index}
        {...entityProps}
      />
    );
  }
}

EntityMapper.propTypes = {
  asyncMapper: PropTypes.bool,
  entityProps: PropTypes.shape(),
  index: PropTypes.number,
  mapper: PropTypes.oneOfType([PropTypes.shape(), PropTypes.func]).isRequired,
  uuid: PropTypes.string.isRequired,
};

EntityMapper.defaultProps = {
  asyncMapper: false,
  entityProps: {},
  index: 0,
};

export default EntityMapper;
