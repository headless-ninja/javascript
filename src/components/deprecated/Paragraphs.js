import React from 'react';
import PropTypes from 'prop-types';
import EntityListMapper from '../../EntityListMapper';
import deprecate from "util-deprecate";

function Paragraphs({ mapper, paragraphs, page, Wrapper, paragraphProps }) {
  return <EntityListMapper
    entities={paragraphs}
    mapper={mapper}
    entityProps={{page, ...paragraphProps}}
    {...(Wrapper ? {entityWrapper: Wrapper} : {})}
  />;
}

Paragraphs.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  paragraphs: PropTypes.arrayOf(PropTypes.shape()),
  page: PropTypes.shape(),
  Wrapper: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]),
  paragraphProps: PropTypes.shape(),
};

Paragraphs.defaultProps = {
  Wrapper: undefined,
  paragraphProps: {},
  page: undefined,
};

export default deprecate(Paragraphs, 'The Paragraphs component is deprecated, use the EntityListMapper component instead');
