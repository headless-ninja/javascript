import PropTypes from 'prop-types';
import React from 'react';
import deprecate from 'util-deprecate';
import EntityMapper, { EntityMapperProps } from '../EntityMapper';

const Paragraph: React.StatelessComponent<ParagraphProps> = ({
  mapper,
  uuid,
  page,
  index,
  paragraphProps,
}) => (
  <EntityMapper
    mapper={mapper}
    uuid={uuid}
    entityProps={{ index, page, ...paragraphProps }}
  />
);

interface ParagraphProps {
  mapper: any;
  uuid: any;
  page?: object;
  index?: number;
  paragraphProps?: object;
}

Paragraph.propTypes = {
  index: PropTypes.number,
  mapper: PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]).isRequired,
  page: PropTypes.shape({}),
  paragraphProps: PropTypes.shape({}),
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
