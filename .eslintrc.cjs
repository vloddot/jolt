module.exports = {
	env: {
		browser: true,
		es2021: true
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:solid/typescript'
	],
	overrides: [
		{
			env: {
				node: true
			},
			files: ['.eslintrc.{js,cjs}'],
			parserOptions: {
				sourceType: 'script'
			}
		}
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['@typescript-eslint', 'solid'],
	rules: {
		indent: ['warn', 'tab', { SwitchCase: 1 }],
		'no-mixed-spaces-and-tabs': 'off',
		'linebreak-style': ['warn', 'unix'],
		quotes: ['warn', 'single'],
		semi: ['warn', 'always'],
		'solid/prefer-for': 'warn',
		'solid/prefer-show': 'warn',
		'solid/prefer-classlist': 'warn'
	}
};
