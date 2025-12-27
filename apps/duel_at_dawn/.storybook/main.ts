// https://github.com/storybookjs/storybook/issues/29567
import { main as baseConfig } from 'config-storybook';
import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	...baseConfig,
	// Ensure stories are resolved relative to this .storybook directory
	stories: [
		'../src/**/*.mdx',
		'../src/**/*.stories.@(js|jsx|ts|tsx|svelte)',
	],
};

export default config;
