import PropTypes from 'prop-types';
import React from 'react';
import deprecate from 'util-deprecate';
import EntityListMapper from '../EntityListMapper';

const Paragraphs: React.StatelessComponent<ParagraphsProps> = ({
  mapper,
  paragraphs,
  page,
  Wrapper,
  paragraphProps,
}) => (
  <EntityListMapper
    entities={paragraphs}
    mapper={mapper}
    entityProps={{ page, ...paragraphProps }}
    {...(Wrapper ? { entityWrapper: Wrapper } : {})}
  />
);

interface ParagraphsProps {
  Wrapper?: any;
  mapper: any;
  page?: any;
  paragraphProps?: any;
  paragraphs?: any;
}

Paragraphs.propTypes = {
  Wrapper: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  mapper: PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]).isRequired,
  page: PropTypes.shape({}),
  paragraphProps: PropTypes.shape({}),
  paragraphs: PropTypes.arrayOf(PropTypes.shape({})),
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
