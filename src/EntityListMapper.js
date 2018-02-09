import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { deprecate } from 'react-is-deprecated';
import Entity from './EntityMapper';

const EntityListMapper = ({ mapper, paragraphs, entities, page, Wrapper, entityWrapper, paragraphProps, entityProps, asyncMapper }) =>
  (entities || paragraphs).map((ref, index) => {
    const EntityWrapper = entityWrapper || Wrapper || Fragment;
    const uuid = ref.target_uuid || ref;
    return (
      <EntityWrapper key={uuid}>
        <Entity
          uuid={uuid}
          index={index}
          mapper={mapper}
          asyncMapper={asyncMapper}
          entityProps={{ page, ...entityProps || paragraphProps }}
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
  paragraphProps: deprecate(PropTypes.shape(), 'Warning: The prop "paragraphProps" is replaced by "entityProps".'),
  paragraphs: deprecate(PropTypes.arrayOf(PropTypes.shape()), 'Warning: The prop "paragraphs" is replaced by "entities".'),
  page: deprecate(PropTypes.shape(), 'Warning: The prop "page" is deprecated. Please use "entityProps={{ page }}" instead.'),
  Wrapper: deprecate(PropTypes.element, 'Warning: The prop "Wrapper" is replaced by "entityWrapper".'),
};

EntityListMapper.defaultProps = {
  Wrapper: undefined,
  entityWrapper: undefined,
  paragraphProps: undefined,
  entityProps: undefined,
  asyncMapper: undefined,
};

export default EntityListMapper;
