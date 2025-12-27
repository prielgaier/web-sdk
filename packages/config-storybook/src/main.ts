import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	// Stories paths are resolved relative to the .storybook directory, not the config file location
	stories: [
		'../src/**/*.mdx',
		'../src/**/*.stories.@(js|jsx|ts|tsx|svelte)',
	],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs'],
	framework: {
		name: '@storybook/sveltekit',
		options: {},
	},
	staticDirs: ['../static'],
};

export default config;
