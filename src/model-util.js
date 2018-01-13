"use strict";

const t = require("babel-types");
const traverse = require("babel-traverse").default;
const TestModel = require("./test-model");

function generate(ast, filename) {
	const testModel = new TestModel();
	let classBodies = [];
	let imports = [];
	let functions = [];
	let functionExpressions = [];
	let requireDeclarations = [];
	let moduleExports = [];
	let exportDeclarations = [];

	testModel.addFilename(filename);

	traverse(ast, {
		ImportDeclaration(path) {
			imports = [...imports, path];
		},

		ClassBody(path) {
			classBodies = [...classBodies, path];
		},

		FunctionDeclaration(path) {
			functions = [...functions, path];
		},

		FunctionExpression(path) {
			functionExpressions = [
				...functionExpressions,
				{
					parentPath: path.parentPath,
					path: path
				}
			];
		},

		CallExpression(path) {
			if (t.isIdentifier(path.node.callee, { name: "require" })) {
				requireDeclarations.push(path.parent);
			}
		},

		MemberExpression(path) {
			if (
				t.isIdentifier(path.node.object, { name: "module" }) &&
        t.isIdentifier(path.node.property, { name: "exports" })
			) {
				moduleExports.push(path.parent);
			}
		},

		ExportDefaultDeclaration(path) {
			exportDeclarations = [
				...exportDeclarations,
				{
					type: "default",
					ast: path
				}
			];
		},

		ExportNamedDeclaration(path) {
			exportDeclarations = [
				...exportDeclarations,
				{
					type: "named",
					ast: path
				}
			];
		}
	});

	imports.forEach(ast => {
		testModel.addImportDeclaration(getImportDeclaration(ast.node));
	});

	exportDeclarations.forEach(declaration => {
		getExportDeclarations(declaration).forEach(element => {
			testModel.addExportDeclaration(element);
		});
	});

	requireDeclarations.forEach(ast => {
		testModel.addRequireDeclaration({
			name: ast.id.name,
			path: ast.init.arguments[0].value
		});
	});

	if (classBodies.length > 0) {
		classBodies.forEach(ast => {
			const classDetails = getClassDetails(ast);
			const methodFilter = classDetails.methods.filter(
				method => method.kind === "method"
			);
			methodFilter.forEach(method => {
				const moduleArray = getModulesFromCallExpressions(
					method.callExpressions
				);

				moduleArray.forEach(element => {
					testModel.addLibrary(element);
				});
			});

			testModel.addClass(classDetails);
		});
	}

	moduleExports.forEach(ast => {
		testModel.addModuleExports(getModuleExports(ast));
	});

	functions.forEach(ast => {
		const functionDetails = getFunctionDeclaration(ast);
		let isExported = testModel.getModuleExports().some(moduleExport => {
			return moduleExport.value === functionDetails.name;
		});

		if (!isExported) {
			isExported = testModel.getExportDeclarations().some(exportDeclaration => {
				return exportDeclaration.name === functionDetails.name;
			});
		}

		if (isExported) {
			testModel.addFunction(functionDetails);

			const moduleArray = getModulesFromCallExpressions(
				functionDetails.callExpressions
			);

			moduleArray.forEach(element => {
				testModel.addLibrary(element);
			});
		}
	});

	functionExpressions.forEach(opts => {
		const functionDetails = getFunctionExpression(opts);
		let isExported = testModel.getModuleExports().some(moduleExport => {
			let foundExport = moduleExport.value === functionDetails.name;

			if (!foundExport) {
				foundExport = functionDetails.callee.some(callee => {
					return moduleExport.value === callee;
				});
			}

			return foundExport;
		});

		if (!isExported) {
			isExported = testModel.getExportDeclarations().some(exportDeclaration => {
				let foundExport = exportDeclaration.name === functionDetails.name;

				if (!foundExport) {
					foundExport = functionDetails.callee.some(callee => {
						return exportDeclaration.name === callee;
					});
				}

				return foundExport;
			});
		}

		if (isExported) {
			testModel.addFunction(functionDetails);

			const moduleArray = getModulesFromCallExpressions(
				functionDetails.callExpressions
			);

			moduleArray.forEach(element => {
				testModel.addLibrary(element);
			});
		}
	});

	if (functionExpressions.length > 0) {
		const constructorFunction = getConstructorFromFunction({
			moduleExports: testModel.getModuleExports(),
			exportDeclarations: testModel.getExportDeclarations(),
			functionList: testModel.getFunctions()
		});

		if (constructorFunction) {
			testModel.updateFunction(constructorFunction);
		}
	}

	// Check if libraries do not contain calls to other funtions/methods
	// in the same module.
	const librariesToRemove = findLibrariesToRemove({
		libraries: testModel.getLibraries(),
		requiredDeclarations: testModel.getRequireDeclarations(),
		imports: testModel.getImportDeclarations()
	});

	librariesToRemove.forEach(library => {
		testModel.removeLibrary(library);
	});

	return testModel;
}

function getClassMethod(ast) {
	const node = ast.node;
	const name = node.key.name;
	const kind = node.kind;
	let returns = false;
	let variables = [];
	let members = [];

	const params = node.params.reduce((acc, value) => {
		const param = t.isAssignmentPattern(value) ? value.left.name : value.name;

		acc.push(param);

		return acc;
	}, []);

	ast.traverse({
		VariableDeclarator: path => {
			variables = [...variables, path.node.id.name];
		},

		AssignmentExpression: path => {
			if (path.node.operator === "=" && t.isMemberExpression(path.node.left)) {
				if (t.isThisExpression(path.node.left.object)) {
					members = [...members, path.node.left.property.name];
				}
			}
		},

		ReturnStatement: () => {
			returns = true;
		}
	});

	return { name, kind, params, variables, members, returns };
}

function getImportDeclaration(node) {
	const path = node.source.value;
	let type = null;
	let names = [];

	node.specifiers.forEach(specifier => {
		if (!type) {
			if (t.isImportSpecifier(specifier)) {
				type = "member";
			} else {
				type = "default";
			}
		}

		names.push(specifier.local.name);
	});

	return { type, names, path };
}

function getCallPath(node) {
	let callee = [];

	const getCallee = function(n, calleeList) {
		if (t.isMemberExpression(n.object)) {
			getCallee(n.object, calleeList);
		} else if (t.isIdentifier(n.object)) {
			calleeList.push(n.object.name);
		} else if (t.isThisExpression(n.object)) {
			calleeList.push("this");
		}

		calleeList.push(n.property.name);

		return calleeList;
	};

	if (t.isIdentifier(node.callee)) {
		callee = [node.callee.name];
	} else if (t.isMemberExpression(node.callee)) {
		callee = getCallee(node.callee, []);
	}

	return callee;
}

// TODO move to getClassDetails
function getFunctionCallExpressions(ast) {
	let callExpressions = [];

	ast.traverse({
		CallExpression: function(path) {
			const callExpression = getCallPath(path.node);

			callExpressions.push(callExpression);
		}
	});

	return callExpressions;
}

function getFunctionDetails(ast) {
	let variables = [];
	let returns = false;
	let callExpressions = [];

	const type = "function";
	const params = ast.node.params.reduce((acc, value) => {
		const param = t.isAssignmentPattern(value) ? value.left.name : value.name;

		acc.push(param);

		return acc;
	}, []);

	ast.traverse({
		VariableDeclaration: function(path) {
			path.node.declarations.forEach(declaration => {
				variables.push(declaration.id.name);
			});
		},

		CallExpression: function(path) {
			callExpressions.push(getCallPath(path.node));
		},

		ReturnStatement: function() {
			returns = true;
		}
	});

	// TODO Check callExpressions for duplicates.

	return {
		type,
		params,
		variables,
		callExpressions,
		returns
	};
}

function getFunctionExpression(opts) {
	const parentPath = opts.parentPath;
	const path = opts.path;

	const getFunctionCallee = function(node, calleeArray) {
		if (t.isMemberExpression(node.object)) {
			getFunctionCallee(node.object, calleeArray);
		} else {
			calleeArray.push(node.object.name);
		}

		calleeArray.push(node.property.name);

		return calleeArray;
	};

	let callee = [];
	let name = "";

	if (t.isVariableDeclarator(parentPath.node)) {
		callee = [parentPath.node.id.name];
	} else if (t.isAssignmentExpression(parentPath.node)) {
		callee = getFunctionCallee(parentPath.node.left, []);
	}

	const functionDetails = getFunctionDetails(path);

	if (callee.length > 1) {
		name = callee[callee.length - 1];
		callee = [...callee.slice(0, callee.length - 1)];
	} else {
		name = callee[0];
		callee = [];
	}

	return Object.assign(functionDetails, { callee, name });
}

function getFunctionDeclaration(ast) {
	const callee = [];
	const name = ast.node.id.name;
	const functionDetails = getFunctionDetails(ast);

	return Object.assign(functionDetails, { callee, name });
}

// TODO
// add check for this type of export:
// module.exports = {
//  add: function() {}
// }
function getModuleExports(node) {
	let moduleExports = [];

	if (t.isIdentifier(node.right)) {
		moduleExports.push({
			name: node.right.name,
			value: node.right.name
		});
	} else if (t.isObjectExpression(node.right)) {
		moduleExports = node.right.properties.reduce((acc, property) => {
			acc.push({
				name: property.key.name,
				value: property.value.name
			});

			return acc;
		}, []);
	}

	return moduleExports;
}

function getConstructorFromFunction(opts) {
	const moduleExports = opts.moduleExports;
	const exportDeclarations = opts.exportDeclarations;
	const functionList = opts.functionList;

	const constructorFunction = functionList.reduce((acc, functionDetails) => {
		const moduleExportExists = moduleExports.some(
			moduleExport => moduleExport.value === functionDetails.name
		);
		const exportExists = exportDeclarations.some(
			exportDeclaration => exportDeclaration.name === functionDetails.name
		);

		if (moduleExportExists || exportExists) {
			acc = functionDetails;
		}

		return acc;
	}, null);

	const isConstructor = constructorFunction
		? functionList.some(functionDetails => {
			const exists = functionDetails.callee.some(callee => {
				return callee === constructorFunction.name;
			});

			return exists;
		})
		: false;

	if (isConstructor) {
		return Object.assign(constructorFunction, {
			type: "constructor"
		});
	}
}

function getExportDeclarations(declaration) {
	let exportDeclarations = [];

	declaration.ast.traverse({
		ExportSpecifier: path => {
			exportDeclarations = [
				...exportDeclarations,
				{
					type: declaration.type,
					name: path.node.exported.name
				}
			];
		},

		ClassDeclaration: path => {
			exportDeclarations = [
				...exportDeclarations,
				{
					type: declaration.type,
					name: path.node.id.name
				}
			];
		},

		// TODO handle function declaration with no name
		// export default function() {}
		FunctionDeclaration: path => {
			exportDeclarations = [
				...exportDeclarations,
				{
					type: declaration.type,
					name: path.node.id.name
				}
			];
		}
	});

	return exportDeclarations;
}

function getClassDetails(ast) {
	let properties = [];
	let methods = [];
	let parentPath = null;

	ast.findParent(path => {
		if (path.isClassDeclaration()) {
			parentPath = path;
		} else if (path.isClassExpression()) {
			parentPath = path;
		}
	});

	ast.traverse({
		ClassProperty: path => {
			properties = [...properties, path.node.key.name];
		},

		ClassMethod: path => {
			const classMethodPartial = getClassMethod(path);
			const callExpressions = getFunctionCallExpressions(path);
			const classMethod = Object.assign(classMethodPartial, {
				callExpressions
			});

			classMethod.members.forEach(member => {
				const propertyExists = properties.some(property => {
					return property === member;
				});

				if (!propertyExists) {
					properties = [...properties, member];
				}
			});

			methods = [...methods, classMethod];
		}
	});

	const name = parentPath.node.id.name;

	const constructorFilter = methods.filter(
		method => method.kind === "constructor"
	);

	if (constructorFilter.length === 0) {
		const constructorMethod = {
			name: "constructor",
			kind: "constructor",
			params: [],
			members: [],
			variables: [],
			returns: false
		};

		methods = [constructorMethod, ...methods];
	}

	return { name, properties, methods };
}

function getModulesFromCallExpressions(callExpressions) {
	const moduleArray = callExpressions.reduce((acc, callPath) => {
		let callDetails = {};

		if (callPath[0] === "this") {
			callDetails = {
				name: callPath[1],
				path: [...callPath.slice(2)],
				thisExpression: true
			};
		} else {
			callDetails = {
				name: callPath[0],
				path: [...callPath.slice(1)],
				thisExpression: false
			};
		}

		acc.push(callDetails);

		return acc;
	}, []);

	return moduleArray;
}

function findLibrariesToRemove(opts) {
	const libraries = opts.libraries;
	const requiredDeclarations = opts.requiredDeclarations;
	const imports = opts.imports;

	const librariesToRemove = libraries.reduce((acc, library) => {
		let importExists = false;
		let requireDeclarationExists = false;

		for (let i = 0; i < imports.length; i++) {
			const exists = imports[i].names.some(name => name === library.name);

			if (exists) {
				importExists = true;
				break;
			}
		}

		if (!importExists) {
			requireDeclarationExists = requiredDeclarations.some(
				declaration => declaration.name === library.name
			);
		}

		if (!importExists && !requireDeclarationExists) {
			acc.push(library);
		}

		return acc;
	}, []);

	return librariesToRemove;
}

module.exports = {
	generate
};
