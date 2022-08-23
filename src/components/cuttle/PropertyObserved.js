import { getPropertyTypeParser } from './PropertyTypeParser.js';

export function getObservedPropertyAttributes(props) {
  return Object.values(props)
    .filter(prop => prop.observed)
    .map(prop => prop.attribute);
}

export function dispatchPropertyAttributeChanged(el, props, attribute, previous, value) {
  for(let { type, attribute: propertyAttribute, propertyChangedCallback } of Object.values(props)) {
    if (propertyChangedCallback && propertyAttribute === attribute) {
      const parser = getPropertyTypeParser(type);
      let parsedPrevious = parser.parse(previous);
      let parsedValue = parser.parse(value);
      propertyChangedCallback.call(el, parsedValue, parsedPrevious, attribute);
      break;
    }
  }
}
