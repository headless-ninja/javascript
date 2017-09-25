import React from 'react';
import PropTypes from 'prop-types';
import Paragraph from './Paragraph';

const Paragraphs = ({ mapper, paragraphs, page, Wrapper, paragraphProps }) =>
  paragraphs.map((uuid, index) => {
    const paragraph = (
      <Paragraph
        key={uuid.target_uuid}
        uuid={uuid.target_uuid}
        page={page}
        index={index}
        mapper={mapper}
        paragraphProps={paragraphProps}
      />
    );
    if(Wrapper) {
      return (
        <Wrapper>
          {paragraph}
        </Wrapper>
      );
    }
    return paragraph;
  });

Paragraphs.propTypes = {
  mapper: PropTypes.oneOfType([
    PropTypes.shape(),
    PropTypes.func,
  ]).isRequired,
  paragraphs: PropTypes.arrayOf(PropTypes.shape()),
  page: PropTypes.shape(),
  Wrapper: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.node,
  ]),
  paragraphProps: PropTypes.shape(),
};

Paragraphs.defaultProps = {
  Wrapper: false,
  paragraphProps: {}
};

export default Paragraphs;
