"use strict";

const t = require("babel-types");
const template = require("@babel/template").default;
const babelGenerate = require("babel-generator").default;
const testFramework = require("./test-framework");
const path = require("path");

function generate(model, opts) {
	const testBuilder = testFramework.getBuilder(opts);
	const imports = createImport({
		importDeclarations: model.getImportDeclarations(),
		libraries: model.getLibraries(),
		testBuilder: testBuilder
	});

	const requireDeclarations = createRequireDeclarations({
		requireDeclarations: model.getRequireDeclarations()
	});

	const mainFileInclude = createMainFileInclude({
		filename: model.getFilename(),
		exportDeclarations: model.getExportDeclarations(),
		moduleExports: model.getModuleExports()
	});

	const tests = createTests({ model, testBuilder });
	const body = [...imports, ...requireDeclarations, mainFileInclude, tests];
	const testAst = t.program(body, []);
	const output = babelGenerate(testAst, {
		quotes: "double"
	});

	return output.code;
}

function createMainFileInclude(opts) {
	const filename = opts.filename;
	const exportDeclarations = opts.exportDeclarations;
	const moduleExports = opts.moduleExports;
	let specifiers = [];

	exportDeclarations.reduce((acc, exportDeclaration) => {
		let specifier = null;

		if (exportDeclaration.type === "named") {
			specifier = t.importSpecifier(
				t.identifier(exportDeclaration.name),
				t.identifier(exportDeclaration.name)
			);
		} else {
			specifier = t.importDefaultSpecifier(
				t.identifier(exportDeclaration.name)
			);
		}

		acc.push(specifier);

		return acc;
	}, specifiers);

	if (specifiers.length === 0) {
		moduleExports.reduce((acc, moduleExport) => {
			let specifier = null;

			specifier = t.importSpecifier(
				t.identifier(moduleExport.value),
				t.identifier(moduleExport.value)
			);

			acc.push(specifier);

			return acc;
		}, specifiers);
	}

	const mainInclude = t.importDeclaration(
		specifiers,
		t.stringLiteral(filename)
	);

	return mainInclude;
}

function createMethodTest(opts) {
	const method = opts.method;
	const className = opts.className;
	const requireDeclarations = opts.requireDeclarations;
	const imports = opts.imports;
	const testBuilder = opts.testBuilder;
	const variables = method.params.reduce((acc, param) => {
		const variable = t.variableDeclaration("const", [
			t.variableDeclarator(t.identifier(param), t.nullLiteral())
		]);

		acc.push(variable);

		return acc;
	}, []);

	const methodCall = method.returns
		? template.ast(`
          const result = ${className}.${method.name}(${method.params.join(
	","
)});
        `)
		: template.ast(`
          ${className}.${method.name}(${method.params.join(",")});
        `);

	let blockStatement = [];

	const preTest = testBuilder.preTest({
		callExpressions: method.callExpressions,
		requireDeclarations,
		imports
	});

	const postTest = testBuilder.postTest({});

	blockStatement.push(...preTest);
	blockStatement.push(...variables);
	blockStatement.push(methodCall);
	blockStatement.push(...postTest);

	const ast = testBuilder.createTestBlock({
		description: method.name,
		blockStatement
	});

	return ast;
}

function createImport(opts) {
	const testBuilder = opts.testBuilder;
	const declarations = opts.importDeclarations;
	const libraries = opts.libraries;

	const testModuleImports = testBuilder.createTestModuleImports();

	const imports = declarations.reduce((acc, declaration) => {
		if (declaration.type === "default") {
			acc.push(
				t.importDeclaration(
					[t.importDefaultSpecifier(t.identifier(declaration.names[0]))],
					t.stringLiteral(declaration.path)
				)
			);
		} else {
			const specifiers = declaration.names.reduce((list, name) => {
				list.push(t.importSpecifier(t.identifier(name), t.identifier(name)));

				return list;
			}, []);

			acc.push(
				t.importDeclaration(specifiers, t.stringLiteral(declaration.path))
			);
		}

		const mockImportList = testBuilder.createMockFromImport({
			path: declaration.path,
			libraries: libraries,
			declarations: declaration.names,
			type: declaration.type
		});

		acc.push(...mockImportList);

		return acc;
	}, []);

	return [...testModuleImports, ...imports];
}

function createFunctionTest(opts) {
	const functionDetails = opts.functionDetails;
	const exportName = opts.exportName;
	const imports = opts.imports;
	const requireDeclarations = opts.requireDeclarations;
	const testBuilder = opts.testBuilder;
	const variables = functionDetails.params.reduce((acc, param) => {
		const variable = t.variableDeclaration("const", [
			t.variableDeclarator(t.identifier(param), t.nullLiteral())
		]);

		acc.push(variable);

		return acc;
	}, []);
	let callExpression = null;
	let blockStatement = [];
	let modifiedCalleeList = [];

	// TODO add comments
	const isPrototypeFunction = functionDetails.callee.some(callee => {
		return callee === "prototype";
	});

	if (isPrototypeFunction) {
		let prototypeIndex = 0;

		for (let i = 0; i < functionDetails.callee.length; i++) {
			if (functionDetails.callee[i] === "prototype") {
				prototypeIndex = i;

				break;
			}
		}

		modifiedCalleeList = [
			...functionDetails.callee.slice(0, prototypeIndex - 1),
			...functionDetails.callee.slice(prototypeIndex)
		];

		modifiedCalleeList = modifiedCalleeList.reduce((acc, value) => {
			if (value !== "prototype") {
				acc.push(value);
			}

			return acc;
		}, []);

		modifiedCalleeList = [
			exportName.charAt(0).toLowerCase() + exportName.slice(1),
			...modifiedCalleeList
		];
	} else {
		modifiedCalleeList = [...functionDetails.callee];
	}

	if (modifiedCalleeList.length > 0) {
		callExpression = `
      ${modifiedCalleeList.join(".")}
      .
      ${functionDetails.name}(
        ${functionDetails.params.join(",")}
      )`;
	} else {
		callExpression = `${exportName}(${functionDetails.params.join(",")})`;
	}

	const functionCall = functionDetails.returns
		? template.ast(`const result = ${callExpression};`)
		: template.ast(`${callExpression};`);

	const preTest = testBuilder.preTest({
		callExpressions: functionDetails.callExpressions,
		requireDeclarations,
		imports
	});

	const postTest = testBuilder.postTest({});

	blockStatement.push(...preTest);
	blockStatement.push(...variables);
	blockStatement.push(functionCall);
	blockStatement.push(...postTest);

	const ast = testBuilder.createTestBlock({
		description: functionDetails.name,
		blockStatement
	});

	return ast;
}

function createTests(opts) {
	const model = opts.model;
	const testBuilder = opts.testBuilder;
	const filenameSplit = model.getFilename().split(path.sep);
	const description = filenameSplit[filenameSplit.length - 1];
	let tests = null;
	let blockStatement = [];
	let constructorList = [];

	// Class
	if (model.getClasses().length > 0) {
		tests = model.getClasses().reduce((acc, classDetails) => {
			const className =
        classDetails.name.charAt(0).toLowerCase() + classDetails.name.slice(1);
			const constructorMethodFilter = classDetails.methods.filter(
				method => method.kind === "constructor"
			);
			const methods = classDetails.methods.filter(
				method => method.kind === "method"
			);

			if (constructorMethodFilter.length > 0) {
				constructorList = [
					...constructorList,
					{
						name: classDetails.name,
						initName: className,
						params: constructorMethodFilter[0].params
					}
				];
			}

			methods.forEach(method => {
				const test = createMethodTest({
					method,
					className,
					imports: model.getImportDeclarations(),
					requireDeclarations: model.getRequireDeclarations(),
					testBuilder
				});

				acc.push(test);
			});

			return acc;
		}, []);

		// Module
	} else {
		const constructorFunctionFilter = model
			.getFunctions()
			.filter(functionDetails => functionDetails.type === "constructor");
		const functionList = model
			.getFunctions()
			.filter(functionDetails => functionDetails.type === "function");

		if (constructorFunctionFilter.length > 0) {
			constructorList = [
				...constructorList,
				{
					name: constructorFunctionFilter[0].name,
					initName:
            constructorFunctionFilter[0].name.charAt(0).toLowerCase() +
            constructorFunctionFilter[0].name.slice(1),
					params: constructorFunctionFilter[0].params
				}
			];
		}

		tests = functionList.reduce((acc, functionDetails) => {
			const moduleExportFilter = model
				.getModuleExports()
				.filter(moduleExport => {
					let exists = moduleExport.value === functionDetails.name;

					if (!exists) {
						exists = functionDetails.callee.some(
							callee => callee === moduleExport.value
						);
					}

					return exists;
				});

			const exportDeclarationFilter = model
				.getExportDeclarations()
				.filter(exportDeclaration => {
					let exists = exportDeclaration.name === functionDetails.name;

					if (!exists) {
						exists = functionDetails.callee.some(
							callee => callee === exportDeclaration.name
						);
					}

					return exists;
				});

			const exportName =
        moduleExportFilter.length > 0
        	? moduleExportFilter[0].value
        	: exportDeclarationFilter[0].name;

			const test = createFunctionTest({
				functionDetails,
				exportName,
				imports: model.getImportDeclarations(),
				requireDeclarations: model.getRequireDeclarations(),
				testBuilder
			});

			acc.push(test);

			return acc;
		}, []);
	}

	if (constructorList.length > 0) {
		const constructorVariables = constructorList.reduce(
			(acc, constructorDetails) => {
				acc.push(
					t.variableDeclaration("let", [
						t.variableDeclarator(
							t.identifier(constructorDetails.initName),
							null
						)
					])
				);

				return acc;
			},
			[]
		);

		const setup = testBuilder.setup({ constructorList });

		blockStatement.push(...constructorVariables);
		blockStatement.push(...setup);
	}

	const teardown = testBuilder.teardown({
		libraries: model.getLibraries(),
		imports: model.getImportDeclarations()
	});

	blockStatement.push(...teardown);
	blockStatement.push(...tests);

	const ast = t.expressionStatement(
		t.callExpression(t.identifier("describe"), [
			t.stringLiteral(description),
			t.arrowFunctionExpression([], t.blockStatement(blockStatement))
		])
	);

	return ast;
}

function createRequireDeclarations(opts) {
	const requireDeclarations = opts.requireDeclarations;
	const requireDeclarationsAst = requireDeclarations.reduce(
		(acc, requiredModule) => {
			const requireStatement = t.variableDeclaration("const", [
				t.variableDeclarator(
					t.identifier(requiredModule.name),
					t.callExpression(t.identifier("require"), [
						t.stringLiteral(requiredModule.path)
					])
				)
			]);

			acc.push(requireStatement);

			return acc;
		},
		[]
	);

	return requireDeclarationsAst;
}

module.exports = {
	generate
};
