import React from 'react';
import PropTypes from 'prop-types';
import site from './site';

const Paragraph = ({ mapper, uuid, page, index, paragraphProps }) => {
  const paragraph = site.getData(uuid);

  if(!paragraph) {
    return null;
  }

  const bundle = `${paragraph.__hn.entity.type}__${paragraph.__hn.entity.bundle}`;

  const Component = (typeof mapper === 'object')
    ? mapper[bundle]
    : typeof mapper === 'function'
      ? mapper(page, bundle)
      : null;

  if(!Component) {
    return null;
  }

  return (
    <Component
      bundle={bundle}
      page={page}
      paragraph={paragraph}
      index={index}
      {...paragraphProps}
    />
  );
};

Paragraph.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  uuid: PropTypes.string.isRequired,
  page: PropTypes.shape({}),
  index: PropTypes.number.isRequired,
  paragraphProps: PropTypes.shape(),
};

Paragraph.defaultProps = {
  paragraphProps: {}
};

export default Paragraph;
