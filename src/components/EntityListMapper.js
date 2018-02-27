import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import EntityMapper from './EntityMapper';

const EntityListMapper = ({
  mapper,
  entities,
  entityWrapper,
  entityProps,
  asyncMapper,
}) =>
  entities.map((ref, index) => {
    const EntityWrapper = entityWrapper || Fragment;
    const uuid = ref.target_uuid || ref;

    return (
      <EntityWrapper key={uuid}>
        <EntityMapper
          uuid={uuid}
          mapper={mapper}
          asyncMapper={asyncMapper}
          entityProps={{ ...entityProps, index }}
        />
      </EntityWrapper>
    );
  });

EntityListMapper.propTypes = {
  asyncMapper: PropTypes.bool,
  entities: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        target_uuid: PropTypes.string.isRequired,
      }),
      PropTypes.string,
    ]),
  ).isRequired,
  entityProps: PropTypes.shape(),
  entityWrapper: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  mapper: PropTypes.oneOfType([PropTypes.shape(), PropTypes.func]).isRequired,
};

EntityListMapper.defaultProps = {
  asyncMapper: undefined,
  entityProps: undefined,
  entityWrapper: undefined,
};

export default EntityListMapper;