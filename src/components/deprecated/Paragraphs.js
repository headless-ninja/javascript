import React from 'react';
import PropTypes from 'prop-types';
import EntityListMapper from '../EntityListMapper';
import deprecate from 'util-deprecate';

function Paragraphs({ mapper, paragraphs, page, Wrapper, paragraphProps }) {
  return (
    <EntityListMapper
      entities={paragraphs}
      mapper={mapper}
      entityProps={{ page, ...paragraphProps }}
      {...(Wrapper ? { entityWrapper: Wrapper } : {})}
    />
  );
}

Paragraphs.propTypes = {
  Wrapper: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  mapper: PropTypes.oneOfType([PropTypes.shape(), PropTypes.func]).isRequired,
  page: PropTypes.shape(),
  paragraphProps: PropTypes.shape(),
  paragraphs: PropTypes.arrayOf(PropTypes.shape()),
};

Paragraphs.defaultProps = {
  Wrapper: undefined,
  page: undefined,
  paragraphProps: {},
};

export default deprecate(
  Paragraphs,
  'The Paragraphs component is deprecated, use the EntityListMapper component instead',
);
