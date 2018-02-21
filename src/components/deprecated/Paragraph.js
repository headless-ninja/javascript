import React from 'react';
import EntityMapper from '../EntityMapper';
import PropTypes from 'prop-types';
import deprecate from 'util-deprecate';

function Paragraph ({ mapper, uuid, page, index, paragraphProps }) {
  return <EntityMapper
    mapper={mapper}
    uuid={uuid}
    entityProps={{index, page, ...paragraphProps}}
  />
}

Paragraph.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  uuid: PropTypes.string.isRequired,
  page: PropTypes.shape({}),
  index: PropTypes.number,
  paragraphProps: PropTypes.shape(),
};

Paragraph.defaultProps = {
  paragraphProps: {},
  index: 0,
  page: undefined,
};

export default deprecate(Paragraph, 'The Paragraph component is deprecated, use the EntityMapper component instead');
