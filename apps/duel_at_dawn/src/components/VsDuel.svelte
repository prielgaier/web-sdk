<script lang="ts">
	import { getContext } from '../game/context';
	import { waitForTimeout } from 'utils-shared/wait';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		vsDuelStart: ({ reel, multiplier }) => {
			console.log(`VS Duel started on reel ${reel} with multiplier ${multiplier}`);
			// TODO: Add VS Duel start animation/effects
		},
		vsDuelAnimate: async ({ reel }) => {
			console.log(`VS Duel animating on reel ${reel}`);
			// TODO: Add VS Duel animation
			// For now, just wait a bit to simulate animation
			await waitForTimeout(1000);
		},
	});
</script>

