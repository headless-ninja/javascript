import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import EntityMapper, { EntityMapperPropsMapper } from './EntityMapper';

const EntityListMapper: React.StatelessComponent<EntityListMapperProps> = ({
  mapper,
  entities,
  entityWrapper,
  entityProps,
  asyncMapper,
}: any): any =>
  entities.map((ref, index) => {
    const EntityWrapper = entityWrapper || Fragment;
    const uuid = isEntityReferenceField(ref) ? ref.target_uuid : ref;

    return (
      <EntityWrapper key={uuid}>
        <EntityMapper
          uuid={uuid}
          mapper={mapper}
          asyncMapper={asyncMapper}
          entityProps={{ ...entityProps, index }}
        />
      </EntityWrapper>
    );
  });

export interface EntityReferenceField {
  target_uuid: string;
}

function isEntityReferenceField(field: any): field is EntityReferenceField {
  return typeof field === 'object' && typeof field.target_uuid === 'string';
}

export interface EntityMapperObject {
  [typeBundle: string]: React.ReactType;
}

export interface EntityListMapperBaseProps {
  entities: (string | EntityReferenceField)[];
  entityWrapper?: React.ReactType;
  entityProps?: object;
}

export type EntityListMapperProps = EntityListMapperBaseProps &
  EntityMapperPropsMapper;

EntityListMapper.propTypes = {
  asyncMapper: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]),
  ]),
  entities: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        target_uuid: PropTypes.string.isRequired,
      }),
      PropTypes.string,
    ]),
  ).isRequired,
  entityProps: PropTypes.shape({}),
  entityWrapper: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  mapper: PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]),
};

EntityListMapper.defaultProps = {
  asyncMapper: undefined,
  entityProps: undefined,
  entityWrapper: undefined,
  mapper: undefined,
};

export default EntityListMapper;
