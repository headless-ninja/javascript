import React from 'react';
import MapperComponent from './components/MapperComponent';
import MapperComponentWithHOC from './components/MapperComponentWithHOC';
import MapperComponentWithHOC2 from './components/MapperComponentWithHOC2';

const mapperComponent = jest.fn(MapperComponent);
const mapperComponentWithHOC = jest.fn(MapperComponentWithHOC);
const mapperComponentWithHOC2 = jest.fn(MapperComponentWithHOC2);

export const mapper = {
  unique_type_1__unique_bundle_1: mapperComponent,
  unique_type_2__unique_bundle_2: mapperComponentWithHOC,
  unique_type_3__unique_bundle_3: mapperComponentWithHOC2,
};

/* tslint:disable */
export const asyncMapper = {
  unique_type_1__unique_bundle_1: jest.fn(() =>
    Promise.resolve(MapperComponent),
  ),
  unique_type_2__unique_bundle_2: jest.fn(() =>
    Promise.resolve(MapperComponentWithHOC),
  ),
  unique_type_3__unique_bundle_3: jest.fn(() =>
    Promise.resolve(MapperComponentWithHOC2),
  ),
};
/* tslint:enable */

export const uuid = 'unique-uuid-1';

export const entity = {
  __hn: {
    entity: {
      bundle: 'unique_bundle_1',
      type: 'unique_type_1',
    },
  },
};

const entity2 = {
  __hn: {
    entity: {
      bundle: 'unique_bundle_2',
      type: 'unique_type_2',
    },
  },
};

const entity3 = {
  __hn: {
    entity: {
      bundle: 'unique_bundle_3',
      type: 'unique_type_3',
    },
  },
};

export const hnData = {
  [uuid]: entity,
  'unique-uuid-2': entity,
  'unique-uuid-3': entity2,
  'unique-uuid-4': entity3,
};

export function mockSite() {
  class SiteMock {
    getData = jest.fn(u => {
      return hnData[u];
    });
    getPage = jest.fn(async () => {
      return uuid;
    });
  }
  return new SiteMock();
}
