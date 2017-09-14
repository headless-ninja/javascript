import React from 'react';
import PropTypes from 'prop-types';
import site from './site';

const Paragraph = ({ mapper, uuid, page, index }) => {
  const paragraph = site.getData(uuid);

  if(!paragraph) {
    return null;
  }

  const Component = typeof mapper === 'function' ? mapper(paragraph.type.target_id) : mapper[paragraph.type.target_id];
  return (
    <Component
      type={paragraph.type.target_id}
      page={page}
      paragraph={paragraph}
      index={index}
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
};

export default Paragraph;
