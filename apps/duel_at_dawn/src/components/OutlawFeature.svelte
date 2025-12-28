<script lang="ts">
	import { getContext } from '../game/context';
	import { waitForTimeout } from 'utils-shared/wait';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		outlawFeatureStart: ({ reel }) => {
			console.log(`Outlaw Feature started on reel ${reel}`);
			// TODO: Add Outlaw Feature start animation/effects
		},
		outlawShootWilds: async ({ shotWilds }) => {
			console.log(`Outlaw shooting ${shotWilds.length} wilds:`, shotWilds);
			// TODO: Add shooting wilds animation
			// For now, just wait a bit to simulate animation
			await waitForTimeout(1000);
		},
	});
</script>

