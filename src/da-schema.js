
    const extend = function(obj, obj2) {
        for (var key in obj) {
            if (typeof obj == typeof obj2)
                if (obj[key] !== null && typeof obj[key] === "object") {
                    extend(obj[key], obj2[key]);
                }
                else {
                    obj[key] = obj2[key] || obj[key];
                }
        }
    }
    const extendFunction = function (...args) {
        let listOfFuncs = [];
        for (let func of arguments) {
            listOfFuncs.push(func);
        }
        return function () {
            for (let func of listOfFuncs) {
                func(arguments[0]);
            }
        };
    };
    function checkJsObject(jsObject, schema) {
        function validJsObjectEngine() {
            const string = function (objProp, schema, key) {
                if (typeof objProp !== schema.type) {
                    throw `Incompatibility value ${objProp} typed as ${schema.type}`;
                }
            };
            const boolean = function (objProp, schema, key) {
                if (typeof objProp !== schema.type) {
                    throw `Incompatibility value ${objProp} typed as ${schema.type}`;
                }
            };
            const number = function (objProp, schema, key) {
                if (typeof objProp !== schema.type) {
                    throw `Incompatibility value ${objProp} typed as ${schema.type}`;
                }
            };
            const object = function (objProp, schema, key) {
                if (typeof objProp !== schema.type) {
                    throw `Incompatibility value ${objProp} typed as ${schema.type}`;
                }
                if (schema.properties) {
                    checkJsObject(objProp, schema.properties);
                }
            };
            const array = function (objProp, schema, key) {
                if (!Array.isArray(objProp)) {
                    throw `Incompatibility value ${objProp} typed as ${schema.type}`;
                }
                if (schema.items) {
                    objProp.forEach((prop, index, array) => {
                        function returnIndex(index, schemaItemLength) {
                            let finalIndex;
                            if (index >= schemaItemLength) {
                                finalIndex = index - schemaItemLength;
                            }
                            else {
                                finalIndex = index;
                            }
                            return finalIndex;
                        }
                        checkJsObject({ arraySubProp: prop }, { arraySubProp: schema.items[returnIndex(index, schema.items.length)] });
                    });
                }
            };
            return {
                string,
                array,
                object,
                boolean,
                number
            };
        }
        function checkProp(obj, schema) {
            for (let key in schema) {
                let type = schema[key].type;
                let validJsObjectEngineInstance = validJsObjectEngine();
                if (Object.keys(validJsObjectEngineInstance).indexOf(type) === -1) {
                    throw `Type ${type} not implemented`;
                }
                if (!obj.hasOwnProperty(key)) {
                    throw `Can't find ${key} in object ${JSON.stringify(obj)}`;
                }
                validJsObjectEngineInstance[type](obj[key], schema[key], key);
            }
        }
        checkProp(jsObject, schema);
    }

    function checkSchema(schemaObject) {
        function validSchemaEngine() {
            const base = function (obj) {
                if (obj.prop.hasOwnProperty('optional')) {
                    if (typeof obj.prop.optional !== 'boolean') {
                        throw `Incompatibility value of optional option`;
                    }
                }
                if (obj.prop.hasOwnProperty('defaultValue')) {
                    checkJsObject({ [obj.key]: obj.prop.defaultValue }, { [obj.key]: obj.prop });
                }
            };
            const string = extendFunction(base, function (obj) {
            });
            const boolean = extendFunction(base, function (obj) {
            });
            const number = extendFunction(base, function (obj) {
            });
            const object = extendFunction(base, function (obj) {
                if (obj.prop.hasOwnProperty('properties')) {
                    let objProp = obj.prop.properties;
                    for (let key in objProp) {
                        checkSchema({ [obj.key]: objProp[key] });
                    }
                }
            });
            const array = extendFunction(base, function (obj) {
                if (obj.prop.hasOwnProperty('items')) {
                    obj.prop.items.forEach((prop, index, array) => {
                        checkSchema({ [obj.key]: prop });
                    });
                }
            });
            return {
                string,
                array,
                object,
                boolean,
                number
            };
        }
        function checkProp(obj) {
            for (let key in obj) {
                let type = obj[key].type;
                let validSchemaEngineInstance = validSchemaEngine();
                if (Object.keys(validSchemaEngineInstance).indexOf(type) === -1) {
                    throw `Type ${type} not implemented`;
                }
                validSchemaEngineInstance[type]({ prop: obj[key], key });
            }
        }
        checkProp(schemaObject);
    }

    module.exports = {
        checkSchema,
        checkJsObject
      }
