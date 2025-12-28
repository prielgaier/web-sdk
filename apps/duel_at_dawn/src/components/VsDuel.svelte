<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';

	import { getContext } from '../game/context';
	import { waitForTimeout } from 'utils-shared/wait';
	import BoardContainer from './BoardContainer.svelte';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	type VsDuelState = {
		reel: number;
		multiplier: number;
		show: boolean;
		alpha: Tween<number>;
	};

	let vsDuelState = $state<VsDuelState | null>(null);

	context.eventEmitter.subscribeOnMount({
		vsDuelStart: ({ reel, multiplier }) => {
			console.log(`VS Duel started on reel ${reel} with multiplier ${multiplier}`);
			vsDuelState = {
				reel,
				multiplier,
				show: true,
				alpha: new Tween(0),
			};
			// Fade in
			vsDuelState.alpha.set(1, { duration: 300 });
		},
		vsDuelAnimate: async ({ reel }) => {
			console.log(`VS Duel animating on reel ${reel}`);
			// Keep text visible during animation - will fade out after vsReelExpand
		},
		vsReelExpand: async ({ reel }) => {
			console.log(`VS Reel ${reel} expanding to wilds`);
			// Fade out after reel expands
			if (vsDuelState && vsDuelState.reel === reel) {
				await waitForTimeout(500); // Show a bit longer after expansion
				vsDuelState.alpha.set(0, { duration: 300 });
				await waitForTimeout(300);
				vsDuelState.show = false;
				vsDuelState = null;
			}
		},
	});
</script>

{#if vsDuelState?.show}
	<BoardContainer>
		<Container
			x={vsDuelState.reel * SYMBOL_SIZE + SYMBOL_SIZE * 0.5}
			y={-SYMBOL_SIZE * 0.8}
			alpha={vsDuelState.alpha.current}
		>
			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				text="VS DUEL"
				style={{
					fontFamily: 'gold',
					fontSize: SYMBOL_SIZE * 0.6,
					align: 'center',
					fontWeight: 'bold',
				}}
			/>
			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				y={SYMBOL_SIZE * 0.5}
				text={`${vsDuelState.multiplier}X`}
				style={{
					fontFamily: 'gold',
					fontSize: SYMBOL_SIZE * 0.8,
					align: 'center',
					fontWeight: 'bold',
				}}
			/>
		</Container>
	</BoardContainer>
{/if}

