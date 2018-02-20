import React from 'react';
import DrupalPage from './DrupalPage';
import site from './site';
import EntityMapper from './EntityMapper';
import EntityListMapper from './EntityListMapper';
import Paragraph from './components/deprecated/Paragraph';
import waitForHnData from './DrupalPage/waitForHnData';

let warningParagraphsDeprecation = false;
const Paragraphs = (p) => {
  if(!warningParagraphsDeprecation) {
    console.warn('Warning: The component "Paragraphs" is deprecated, use "EntityListMapper" instead.');
    warningParagraphsDeprecation = true;
  }
  return <EntityListMapper {...p} />;
};

export {
  DrupalPage,
  site,
  EntityMapper,
  Paragraph,
  EntityListMapper,
  Paragraphs,
  waitForHnData,
};
