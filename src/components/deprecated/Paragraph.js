import React from 'react';
import EntityMapper from '../EntityMapper';
import PropTypes from 'prop-types';
import deprecate from 'util-deprecate';

function Paragraph({ mapper, uuid, page, index, paragraphProps }) {
  return (
    <EntityMapper
      mapper={mapper}
      uuid={uuid}
      entityProps={{ index, page, ...paragraphProps }}
    />
  );
}

Paragraph.propTypes = {
  index: PropTypes.number,
  mapper: PropTypes.oneOfType([PropTypes.shape(), PropTypes.func]).isRequired,
  page: PropTypes.shape({}),
  paragraphProps: PropTypes.shape(),
  uuid: PropTypes.string.isRequired,
};

Paragraph.defaultProps = {
  index: 0,
  page: undefined,
  paragraphProps: {},
};

export default deprecate(
  Paragraph,
  'The Paragraph component is deprecated, use the EntityMapper component instead',
);
