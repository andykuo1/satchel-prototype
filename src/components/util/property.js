export function defaultProperty(element, attributeName, defaultAttributeValue)
{
    if (!element.hasAttribute(attributeName))
    {
        element.setAttribute(attributeName, defaultAttributeValue);
    }
}

export function upgradeProperty(element, propertyName)
{
    if (element.hasOwnProperty(propertyName))
    {
        let value = element[propertyName];
        delete element[propertyName];
        element[propertyName] = value;
    }
}

export function getPropertyParser(propertyType = String)
{
    if (propertyType === String) return StringParser;
    else if (propertyType === Boolean) return BooleanParser;
    else if (propertyType === Number) return NumberParser;
    else if (propertyType === Function) return FunctionParser;
    else if (propertyType === Symbol) throw new Error('Symbols cannot be a non-cached property type - unable to preserve uniqueness when converted to string.');
    else
    {
        const type = typeof propertyType;
        if (type === 'function')
        {
            return TypedParser(Type);
        }
        else if (type === 'object')
        {
            return propertyType;
        }
        else
        {
            throw new Error('Unknown property type.');
        }
    }
}

export function getPropertyGetter(attributeName, propertyName, propertyType = String, cached = true)
{
    if (cached) return bindFunction(getCachedProperty, propertyName);
    else if (propertyType === String) return bindFunction(getStringProperty, attributeName);
    else if (propertyType === Boolean) return bindFunction(getBooleanProperty, attributeName);
    else if (propertyType === Number) return bindFunction(getNumberProperty, attributeName);
    else if (propertyType === Function) return bindFunction(getFunctionProperty, propertyName);
    else if (propertyType === Symbol) throw new Error('Symbols cannot be a non-cached property type - unable to preserve uniqueness when converted to string.');
    else
    {
        const type = typeof propertyType;
        if (type === 'function')
        {
            return bindFunction(getTypedProperty, propertyType, attributeName);
        }
        else if (type === 'object')
        {
            return bindFunction(getParsedProperty, propertyType, attributeName);
        }
        else
        {
            throw new Error('Unknown property type.');
        }
    }
}

export function getPropertySetter(attributeName, propertyName, propertyType = String, cached = false)
{
    if (cached) return bindFunction(setCachedProperty, propertyName);
    else if (propertyType === String) return bindFunction(setStringProperty, attributeName);
    else if (propertyType === Boolean) return bindFunction(setBooleanProperty, attributeName);
    else if (propertyType === Number) return bindFunction(setNumberProperty, attributeName);
    else if (propertyType === Function) return bindFunction(setFunctionProperty, propertyName);
    else if (propertyType === Symbol) throw new Error('Symbols cannot be a non-cached property type - unable to preserve uniqueness when converted from string.');
    else
    {
        const type = typeof propertyType;
        if (type === 'function')
        {
            return bindFunction(setTypedProperty, attributeName);
        }
        else if (type === 'object')
        {
            return bindFunction(setParsedProperty, propertyType, attributeName);
        }
        else
        {
            throw new Error('Unknown property type.');
        }
    }
}

export function updateCachedProperty(element, key, value)
{
    element['_' + key] = value;
}

export function typeParse(type, value)
{
    if (typeof type === 'function')
    {
        if (type === Boolean)
        {
            return value === '';
        }
        else
        {
            return type.call(undefined, value);
        }
    }
    else
    {
        return type.parse(value);
    }
}

export function typeStringify(type, value)
{
    if (typeof type === 'function')
    {
        return String(type);
    }
    else
    {
        return type.stringify(value);
    }
}

function bindFunction(func, ...a)
{
    let result = function(...b) { return func.call(this, ...a, ...b); };
    Object.defineProperty(result, 'name', { value: func.name });
    return result;
}

function getCachedProperty(key) { return this['_' + key]; }
function setCachedProperty(key, value) { this['_' + key] = value; }

function getTypedProperty(Type, key) { return Type(this.getAttribute(key)); }
function setTypedProperty(key, value) { this.setAttribute(key, String(value)); }

function getParsedProperty(Parser, key) { return Parser.parse(this.getAttribute(key)); }
function setParsedProperty(Parser, key, value) { this.setAttribute(key, Parser.stringify(value)); }

function getStringProperty(key) { return this.getAttribute(key); }
function setStringProperty(key, value) { return this.setAttribute(key, value); }

function getBooleanProperty(key) { return this.hasAttribute(key); }
function setBooleanProperty(key, value)
{
    if (value) this.setAttribute(key, '');
    else this.removeAttribute(key);
}

function getNumberProperty(key) { return Number(this.getAttribute(key)); }
function setNumberProperty(key, value) { this.setAttribute(key, value); }

function getFunctionProperty(key) { return this[`_${key}`]; }
function setFunctionProperty(key, value) { this[`_${key}`] = value; }

const StringParser = {
    stringify: String,
    parse: String,
};
const BooleanParser = {
    stringify: String,
    parse: Boolean,
};
const NumberParser = {
    stringify: String,
    parse: Number,
};
const FunctionParser = {
    stringify: String,
    parse: value => new Function(`with(document){with(this){${value}}}`),
};
function TypedParser(Type)
{
    return {
        stringify: String,
        parse: Type,
    };
}
