import React from 'react';

const mapperComponent = jest.fn((props) => {
  return <div className="MyCustomMapperComponent" {...props} />
});

export const mapper = {
  unique_type__unique_bundle: mapperComponent
};

export const uuid = 'unique-uuid';

export const entity = {
  __hn: {
    entity: {
      type: 'unique_type',
      bundle: 'unique_bundle'
    }
  }
};

export function mockSite() {
  class SiteMock {
    getData = jest.fn(() => {
      return entity;
    });
    getPage = jest.fn(async () => {
      return uuid;
    })
  }
  return new SiteMock();
}
