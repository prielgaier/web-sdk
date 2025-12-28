<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';

	import { getContext } from '../game/context';
	import { waitForTimeout } from 'utils-shared/wait';
	import BoardContainer from './BoardContainer.svelte';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	type OutlawState = {
		reel: number;
		show: boolean;
		alpha: Tween<number>;
		shooting: boolean;
	};

	let outlawState = $state<OutlawState | null>(null);

	context.eventEmitter.subscribeOnMount({
		outlawFeatureStart: ({ reel }) => {
			console.log(`Outlaw Feature started on reel ${reel}`);
			outlawState = {
				reel,
				show: true,
				alpha: new Tween(0),
				shooting: false,
			};
			// Fade in
			outlawState.alpha.set(1, { duration: 300 });
		},
		outlawShootWilds: async ({ shotWilds }) => {
			console.log(`Outlaw shooting ${shotWilds.length} wilds:`, shotWilds);
			if (outlawState) {
				outlawState.shooting = true;
			}
			// Keep text visible during shooting - will fade out after outlawWildsPlace
		},
		outlawWildsPlace: async ({ shotWilds }) => {
			console.log(`Outlaw wilds placed:`, shotWilds);
			// Fade out after wilds are placed
			if (outlawState) {
				await waitForTimeout(500); // Show a bit longer after placement
				outlawState.alpha.set(0, { duration: 300 });
				await waitForTimeout(300);
				outlawState.show = false;
				outlawState = null;
			}
		},
	});
</script>

{#if outlawState?.show}
	<BoardContainer>
		<Container
			x={outlawState.reel * SYMBOL_SIZE + SYMBOL_SIZE * 0.5}
			y={-SYMBOL_SIZE * 0.8}
			alpha={outlawState.alpha.current}
		>
			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				text="OUTLAW FEATURE"
				style={{
					fontFamily: 'gold',
					fontSize: SYMBOL_SIZE * 0.5,
					align: 'center',
					fontWeight: 'bold',
				}}
			/>
			{#if outlawState.shooting}
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					y={SYMBOL_SIZE * 0.5}
					text="SHOOTING!"
					style={{
						fontFamily: 'gold',
						fontSize: SYMBOL_SIZE * 0.6,
						align: 'center',
						fontWeight: 'bold',
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
{/if}

