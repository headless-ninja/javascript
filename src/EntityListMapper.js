import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Entity from './EntityMapper';

const EntityListMapper = ({ mapper, entities, entityWrapper, entityProps, asyncMapper }) =>
  entities.map((ref, index) => {
    const EntityWrapper = entityWrapper || Fragment;
    const uuid = ref.target_uuid || ref;
    return (
      <EntityWrapper key={uuid}>
        <Entity
          uuid={uuid}
          index={index}
          mapper={mapper}
          asyncMapper={asyncMapper}
          entityProps={entityProps}
        />
      </EntityWrapper>
    );
  });

EntityListMapper.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  entities: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.shape({
      target_uuid: PropTypes.string.isRequired,
    }),
    PropTypes.string,
  ])).isRequired,
  entityWrapper: PropTypes.element,
  entityProps: PropTypes.shape(),
  asyncMapper: PropTypes.bool,
};

EntityListMapper.defaultProps = {
  entityWrapper: undefined,
  entityProps: undefined,
  asyncMapper: undefined,
};

export default EntityListMapper;
