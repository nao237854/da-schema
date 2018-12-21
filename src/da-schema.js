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
				if (typeof result === 'undefined') result = func(...arguments);
			}
			return result;
		};
	};

	function createJsObject(schema, config = {}) {

		let tmpSchema = JSON.parse(JSON.stringify(schema));
		let jsObject = {};

		if (!config.notValidateSchema) {
			let validateSchema = checkSchema(tmpSchema);
			if (!validateSchema.valid) {
				return null;
			}
		}

		function generateValue() {

			const base = function (jsObj, schema, config) {
				if (typeof schema.defaultValue !== 'undefined') {
					return schema.defaultValue;
				}

			};
			const string = extendFunction(base, function (jsObj, schema, config) {
				if (config.empty) return  '';
				else return 'stringValue';

			});

			const number = extendFunction(base, function (jsObj, schema, config) {
				if (config.empty) return null;
				else return 0
			});

			const boolean = extendFunction(base, function (jsObj, schema, config) {
				return true;
			});

			const object = extendFunction(base, function (jsObj, schema, config) {
				let newObject = {};
				if (schema.properties) {
					for (let key in schema.properties) {
						newObject[key] = generateValueInstance[schema.properties[key].type](jsObj, schema.properties[key],config);
					}
				} else {
					newObject[key] = {};
				}
				return newObject;
			});
			const array = extendFunction(base, function (jsObj, schema, config) {
				let newArray = [];
				if (schema.items && schema.defaultValue) {
					schema.items.forEach((prop, index, array) => {
						let itemValue = generateValueInstance[prop.type](jsObj, prop, config);
						newArray.push(itemValue[Object.keys(itemValue)[0]]);
					});
				}

				return newArray;
			});

			return {
				string,
				number,
				boolean,
				object,
				array
			};
		}


		let generateValueInstance = generateValue();
		return generateValueInstance[tmpSchema.type](jsObject, tmpSchema, config);
	}

	function checkJsObject(jsObject, schema, config = {}) {

		let tmpSchema = JSON.parse(JSON.stringify(schema));

		if (!config.notValidateSchema) {
			const validateSchema = checkSchema(tmpSchema);
			if (!validateSchema.valid) {
				return { valid: false, schema: validateSchema.schema }
			}
		}

		let status = { valid: true };

		function validJsObjectEngine() {
			const string = function (objProp, schema, status, data={},config={}) {
				if(!config.notClearWarrnings){
					schema.warnings = [];
				}
				if (typeof objProp !== schema.type) {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Value must be a string',
						data:data
					});
					status.valid = false;
				} else if (!schema.optional && objProp === "") {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Value must not be empty',
						data:data
					});
					status.valid = false;
				}
			};
			const boolean = function (objProp, schema, status, data={},config={}) {
				if(!config.notClearWarrnings){
					schema.warnings = [];
				}
				if (typeof objProp !== schema.type) {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Value must be a boolean',
						data:data
					});
					status.valid = false;
				}
			};
			const number = function (objProp, schema, status, data={},config={}) {
				if(!config.notClearWarrnings){
					schema.warnings = [];
				}
				if (typeof objProp !== schema.type) {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Value must be a number',
						data:data
					});
					status.valid = false;
				}
			};
			const object = function (objProp, schema, status,data={},config={}) {
				if(!config.notClearWarrnings){
					schema.warnings = [];
				}
				if (typeof objProp !== schema.type) {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Value must be an object'
					});
					status.valid = false;
				} else if (schema.properties) {
					for (let key in schema.properties) {
						if(!schema.properties[key].optional){
							if (!objProp.hasOwnProperty(key)) {
								schema.warnings.push({
									status: 'invalid',
									tip: 'Missing one of properties: ' + key
								});
								status.valid = false;
							} else {
								validJsObjectEngineInstance[schema.properties[key].type](objProp[key], schema.properties[key], status);
							}
						}
						

					}


				}
			};
			const array = function (objProp, schema, status, data={},config={}) {
				if(!config.notClearWarrnings){
					schema.warnings = [];
				}
				if (!Array.isArray(objProp)) {
					schema.warnings.push =({
						status: 'invalid',
						tip: 'Value must be an array'
					});
					status.valid = false;
				} else if (!schema.optional && objProp === null) {
					schema.warnings.push({
						status: 'invalid',
						tip: 'Array must not be empty'
					});
					status.valid = false;
				} else if (schema.items) {
					schema.items.forEach((prop, index, array) => { prop.warnings = []; });
					objProp.forEach((prop, index, array) => {
						function returnIndex(index, schemaItemLength) {
							let finalIndex;
							if (index >= schemaItemLength) {
								finalIndex = index - (Math.floor(index/schemaItemLength)*schemaItemLength);
							} else {
								finalIndex = index;
							}
							return finalIndex;
						}
						validJsObjectEngineInstance[schema.items[returnIndex(index, schema.items.length)].type](prop, schema.items[returnIndex(index, schema.items.length)], status, {name:index},{notClearWarrnings:true});
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

		let validJsObjectEngineInstance = validJsObjectEngine();
		validJsObjectEngineInstance[tmpSchema.type](jsObject, tmpSchema, status);

		return { valid: status.valid, schema: tmpSchema };

	}

	function checkSchema(schema) {


		let tmpSchema = JSON.parse(JSON.stringify(schema));
		let status = { valid: true };

		function validSchemaEngine() {
			const base = function (schema, status) {
				schema.warnings = [];
				if (schema.hasOwnProperty('optional')) {
					if (typeof schema.optional !== 'boolean') {
						schema.warnings.push({ status: 'invalid', tip: `Incompatibility value of optional option` });
						status.valid = false;
					}
				}
				if (schema.hasOwnProperty('defaultValue')) {
					let validateJsObject = checkJsObject(schema.defaultValue, JSON.parse(JSON.stringify(schema)), { notValidateSchema: true });
					if (!validateJsObject.valid) {
						schema.warnings.push({status: 'invalid', tip: `Wrong defaultValue`});
						status.valid = false;
					}
				}
			};
			const string = extendFunction(base, function (schema, status) {});
			const boolean = extendFunction(base, function (schema, status) { });
			const number = extendFunction(base, function (schema, status) { });
			const object = extendFunction(base, function (schema, status) {
				if (schema.hasOwnProperty('properties')) {
					for (let key in schema.properties) {
							if (Object.keys(validSchemaEngineInstance)
								.indexOf(schema.properties[key].type) === -1) {
								schema.warnings = { status: 'invalid', tip: `Type ${schema.properties[key].type} not implemented` };
								status.valid = false;
							} else {
								validSchemaEngineInstance[schema.properties[key].type](schema.properties[key],status);
							}

						
					}
				}
			});
			const array = extendFunction(base, function (schema, status) {
				if (schema.hasOwnProperty('items')) {
					schema.items.forEach((prop, index, array) => {
						validSchemaEngineInstance[schema.items[index].type](schema.items[index],status)
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

		let validSchemaEngineInstance = validSchemaEngine();
		validSchemaEngineInstance[tmpSchema.type](tmpSchema, status);
		return { valid: status.valid, schema: tmpSchema };

	}

	module.exports = {
		checkSchema,
		checkJsObject,
		createJsObject
	};
})();
