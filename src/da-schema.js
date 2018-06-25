;
(() => {
	const extendFunction = function (...args) {
		let listOfFuncs = [];
		for (let func of arguments) {
			listOfFuncs.push(func);
		}
		return function () {
			let result;
			for (let func of listOfFuncs) {
				if (!result) result = func(...arguments);
			}
			return result;
		};
	};

	function createJsObject(schema, jsObject = {}, config = {}) {
		if (!config.notValidateSchema) {
			let validateSchema = checkSchema(schema);
			if(!validateSchema.valid){
				return {valid:false, schema:null, tip:validateSchema.tip+" in a schema"}
			}
		}

		function generateValue() {

			const base = function (jsObj, schema, key) {
				if (schema.defaultValue) {
					return {
						[key]: schema.defaultValue
					};
				}

			};
			const string = extendFunction(base, function (jsObj, schema, key) {
				return {
					[key]: 'stringValue'
				};
			});

			const number = extendFunction(base, function (jsObj, schema, key) {
				return {
					[key]: 1
				};
			});

			const boolean = extendFunction(base, function (jsObj, schema, key) {
				return {
					[key]: true
				};
			});

			const object = extendFunction(base, function (jsObj, schema, key) {
				let newObject = {};
				if (schema.properties) {
					newObject[key] = createJsObject(schema.properties, {}, {notValidateSchema:true});
				} else {
					newObject[key] = {};
				}
				return newObject;
			});
			const array = extendFunction(base, function (jsObj, schema, key) {
				let newObject = [];
				newObject[key] = [];
				if (schema.items) {
					schema.items.forEach((prop, index, array) => {
						let itemValue = generateValue()[prop.type](jsObj, prop, key);
						newObject[key].push(itemValue[Object.keys(itemValue)[0]]);
					});
				}

				return newObject;
			});

			return {
				string,
				number,
				boolean,
				object,
				array
			};
		}

		for (let key in schema) {
			let type = schema[key].type;
			let generateValueInstance = generateValue();

			Object.assign(jsObject, generateValueInstance[type](jsObject, schema[key], key));
		}

		return jsObject;
	}

	function checkJsObject(jsObject, schema, config = {}) {
		if (!config.notValidateSchema) {
			let validateSchema = checkSchema(schema);
			if(!validateSchema.valid){
				return {valid:false, schema:null, tip:validateSchema.tip+" in a schema"}
			}
		}
		config = Object.assign(config, {valid:true})
		config.notValidateSchema = true;

		function validJsObjectEngine() {
			const string = function (objProp, schema, key, config) {
				if (typeof objProp !== schema.type) {
					schema.state = {
						status: 'invalid',
						tip: 'Value must be a string'
					};
					config.valid=false;
				} else if (!schema.optional && objProp === "") {
					schema.state = {
						status: 'invalid',
						tip: 'Value must not be empty'
					};
					config.valid=false;
				}
			};
			const boolean = function (objProp, schema, key, config) {
				if (typeof objProp !== schema.type) {
					schema.state = {
						status: 'invalid',
						tip: 'Value must be a boolean'
					};
					config.valid=false;
				}
			};
			const number = function (objProp, schema, key, config) {
				if (typeof objProp !== schema.type) {
					schema.state = {
						status: 'invalid',
						tip: 'Value must be a number'
					};
					config.valid=false;
				}
			};
			const object = function (objProp, schema, key, config) {
				if (typeof objProp !== schema.type) {
					schema.state = {
						status: 'invalid',
						tip: 'Value must be a string'
					};
					config.valid=false;
				}
				if (schema.properties) {
					checkJsObject(objProp, schema.properties,config);
				}
			};
			const array = function (objProp, schema, key, config) {
				if (!Array.isArray(objProp)) {
					schema.state = {
						status: 'invalid',
						tip: 'Value must be an array'
					};
					config.valid=false;
				}
				if (schema.items) {
					objProp.forEach((prop, index, array) => {
						function returnIndex(index, schemaItemLength) {
							let finalIndex;
							if (index >= schemaItemLength) {
								finalIndex = index - schemaItemLength;
							} else {
								finalIndex = index;
							}
							return finalIndex;
						}
						checkJsObject({ arraySubProp: prop }, { arraySubProp: schema.items[returnIndex(index, schema.items.length)] },config);
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

		for (let key in schema) {
			let type = schema[key].type;
			let validJsObjectEngineInstance = validJsObjectEngine();
			if (!jsObject.hasOwnProperty(key)) {
				schema.state = {
					status: 'invalid',
					tip: 'Missing one of properties: ' + key
				};
			} else {
				validJsObjectEngineInstance[type](jsObject[key], schema[key], key, config);
			}

		}
		return {valid:config.valid, schema:schema};

	}

	function checkSchema(schema) {
		function validSchemaEngine() {
			const base = function (schema, key) {
				if (schema.hasOwnProperty('optional')) {
					if (typeof schema.optional !== 'boolean') {
						return { valid: false, tip: `Incompatibility value of optional option at ${key}` };
					}
				}
				if (schema.hasOwnProperty('defaultValue')) {
					let validateJsObject = checkJsObject({
						[key]: schema.defaultValue
					}, {
						[key]: schema
					}, {notValidateSchema:true});
					if(!validateJsObject.valid){
						return { valid: false, tip: `Wrong defaultValue at ${key}` };
					}
				}
			};
			const string = extendFunction(base, function (schema, key) { return { valid: true } });
			const boolean = extendFunction(base, function (schema, key) { return { valid: true } });
			const number = extendFunction(base, function (schema, key) { return { valid: true } });
			const object = extendFunction(base, function (schema, key) {
				if (schema.hasOwnProperty('properties')) {
					let objProp = schema.properties;
					for (let key in objProp) {
						return checkSchema({
							[key]: objProp[key]
						});
					}
				}
				return { valid: true }
			});
			const array = extendFunction(base, function (schema, key) {
				if (schema.hasOwnProperty('items')) {
					schema.items.forEach((prop, index, array) => {
						return checkSchema({
							[key]: prop
						});
					});
				}
				return { valid: true }
			});
			return {
				string,
				array,
				object,
				boolean,
				number
			};
		}

		for (let key in schema) {
			let type = schema[key].type;
			let validSchemaEngineInstance = validSchemaEngine();
			if (Object.keys(validSchemaEngineInstance)
				.indexOf(type) === -1) {
				return { valid: false, tip: `Type ${type} not implemented` };
			} else {
				return validSchemaEngineInstance[type](schema[key], key);
			}
		}


	}

	module.exports = {
		checkSchema,
		checkJsObject,
		createJsObject
	};
})();
