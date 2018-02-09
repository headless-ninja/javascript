import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getNested from 'get-nested';
import { deprecate } from 'react-is-deprecated';
import site from './site';

class EntityMapper extends Component {
  static entityComponents = new Map();

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
    let entityComponent = typeof mapper === 'function' ? mapper(entity, bundle) : mapper[bundle];

    // If asyncMapper is true, execute the function so it returns a promise.
    if(asyncMapper && typeof entityComponent === 'function') {
      entityComponent = entityComponent();
    }

    // If a promise was returned, resolve it.
    if(entityComponent && typeof entityComponent.then !== 'undefined') {
      entityComponent = await entityComponent;
    }

    // Make sure there is an entityComponent.
    if(!entityComponent) return null;

    // If it has a .default (ES6+), use that.
    if(entityComponent.default) {
      entityComponent = entityComponent.default;
    }

    // Store the entityComponent globally, so it can be rendered sync.
    const entityComponentSymbol = Symbol.for(entityComponent);
    EntityMapper.entityComponents.set(entityComponentSymbol, entityComponent);

    return entityComponentSymbol;
  }

  static getBundle = entity => getNested(() => `${entity.__hn.entity.type}__${entity.__hn.entity.bundle}`, '_fallback');

  state = {
    entityComponentSymbol: null,
    ready: false,
    uuid: null,
    page: null,
  };

  componentDidMount() {
    this.loadComponent(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.uuid !== nextProps.uuid || this.props.mapper !== nextProps.mapper || this.props.asyncMapper !== nextProps.asyncMapper) {
      this.loadComponent(nextProps);
    }
  }

  async loadComponent({ uuid, page, mapper, asyncMapper }) {
    this.setState({ ready: false });
    const entityComponentSymbol = await EntityMapper.assureComponent({ uuid, mapper, asyncMapper });
    this.setState({ uuid, page, entityComponentSymbol, ready: true });
  }

  isReady() {
    return this.state.ready;
  }

  render() {
    const { index, entityProps, paragraphProps } = this.props;
    const { page, uuid, entityComponentSymbol } = this.state;

    const entity = site.getData(uuid);

    if(!entity) return null;

    const Component = EntityMapper.entityComponents.get(entityComponentSymbol);

    if(!Component) return null;

    return (
      <Component
        {...paragraphProps}
        {...entityProps}
        bundle={EntityMapper.getBundle(entity)}
        page={page}
        paragraph={entity}
        entity={entity}
        index={index}
      />
    );
  }
}

EntityMapper.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  asyncMapper: PropTypes.bool,
  uuid: PropTypes.string.isRequired,
  page: deprecate(PropTypes.shape(), 'Warning: The prop "page" is deprecated. Please use "entityProps={{ page }}" instead.'),
  index: PropTypes.number,
  entityProps: PropTypes.shape(),
  paragraphProps: deprecate(PropTypes.shape(), 'Warning: The prop "paragraphProps" is replaced by "entityProps".'),
};

EntityMapper.defaultProps = {
  asyncMapper: false,
  page: undefined,
  entityProps: {},
  paragraphProps: undefined,
  index: 0,
};

export default EntityMapper;
