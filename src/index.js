import React from 'react';
import DrupalPage from './DrupalPage';
import site from './site';
import EntityMapper from './EntityMapper';
import EntityListMapper from './EntityListMapper';
import waitForHnData from './DrupalPage/waitForHnData';

let warningParagraphDeprecation = false;
const Paragraph = (p) => {
  if(!warningParagraphDeprecation) {
    console.warn('Warning: The component "Paragraph" is deprecated, use "EntityMapper" instead.');
    warningParagraphDeprecation = true;
  }
  return <EntityMapper {...p} />;
};

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
