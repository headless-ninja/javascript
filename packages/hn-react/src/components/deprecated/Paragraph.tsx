import * as PropTypes from 'prop-types';
import * as React from 'react';
import EntityMapper from '../EntityMapper';

const deprecate = require('util-deprecate'); // tslint:disable-line:no-var-requires

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

export interface ParagraphProps {
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
