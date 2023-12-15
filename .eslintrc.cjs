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
	plugins: ['@typescript-eslint', 'solid', 'jsx-a11y'],
	rules: {
		'no-mixed-spaces-and-tabs': 'off',
		'linebreak-style': ['warn', 'unix'],
		semi: ['warn', 'always'],
		'solid/prefer-for': 'warn',
		'solid/prefer-show': 'warn',
		'solid/prefer-classlist': 'warn'
	}
};
