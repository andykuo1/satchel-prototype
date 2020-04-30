import {
    defaultProperty,
    upgradeProperty,
    getPropertySetter,
    getPropertyGetter,
    updateCachedProperty,
    typeParse
} from './property.js';

const ATTRIBUTE_TO_PROPERTY_NAME_MAP = Symbol('attributeToPropertyNameMap');

export function getAssignedPropertyNameForAttribute(properties, attribute)
{
    return properties[ATTRIBUTE_TO_PROPERTY_NAME_MAP][attribute];
}

export function callbackAssignedProperties(element, properties, attribute, prev, value, callbacks)
{
    let propertyName = getAssignedPropertyNameForAttribute(properties, attribute);
    if (propertyName)
    {
        let property = properties[propertyName];
        let prevValue = element[propertyName];
        let nextCachedValue = typeParse(property.type, value);
        updateCachedProperty(element, propertyName, nextCachedValue);
        if (propertyName in callbacks)
        {
            callbacks[propertyName].call(element, nextCachedValue, prevValue, attribute);
        }
    }
}

export function defaultAndUpgradeProperties(element, properties, opts)
{
    let keys = Object.keys(properties);
    for(let propertyName of keys)
    {
        let property = properties[propertyName];
        if (typeof property === 'object' && 'value' in property)
        {
            defaultProperty(element, propertyName, property.value);
        }
    }

    for(let propertyName of keys)
    {
        upgradeProperty(element, propertyName);
    }
}

export function assignProperties(constructor, properties, opts = {})
{
    let observedAttributes = [];
    let attributeToPropertyNameMap = {};
    
    for(let propertyName of Object.keys(properties))
    {
        let property = properties[propertyName];
        
        if (typeof property === 'function')
        {
            property = { type: property };
            properties[propertyName] = property;
        }
        else if (typeof property !== 'object' || !property)
        {
            throw new Error(`Unknown property type for '${propertyName}'.`);
        }

        if ('parse' in property) property = { type: property };
        if (!('attribute' in property)) property.attribute = camelToKebab(propertyName);
        if (!('observed' in property)) property.observed = true;

        let type = property.type;
        let attributeName = property.attribute;
        attributeToPropertyNameMap[attributeName] = propertyName;
        if (property.observed) observedAttributes.push(attributeName);

        assignProperty(constructor, propertyName, type || String, attributeName);
    }

    properties[ATTRIBUTE_TO_PROPERTY_NAME_MAP] = attributeToPropertyNameMap;

    if (observedAttributes.length > 0) assignObservedAttributes(constructor, observedAttributes);

    return properties;
}

export function assignProperty(constructor, propertyName, propertyType = String, attributeName = camelToKebab(propertyName))
{
    const setter = getPropertySetter(attributeName, propertyName, propertyType, false);
    const getter = getPropertyGetter(attributeName, propertyName, propertyType, true);

    Object.defineProperty(constructor.prototype, propertyName, {
        set: setter,
        get: getter,
    });

    return self;
}

export function assignObservedAttributes(constructor, observedAttributes)
{
    let prevObservedAttributes = constructor.observedAttributes || [];
    let result = [
        ...prevObservedAttributes,
        ...observedAttributes,
    ];
    Object.defineProperty(constructor, 'observedAttributes', {
        value: result,
    });
}

export function camelToKebab(string)
{
    // SOURCE: https://gist.github.com/nblackburn/875e6ff75bc8ce171c758bf75f304707
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
