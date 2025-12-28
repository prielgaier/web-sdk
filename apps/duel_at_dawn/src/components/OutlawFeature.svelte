<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Graphics } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	type OutlawEffect = {
		reel: number;
		alpha: Tween<number>;
		scale: Tween<number>;
	};

	type ShootingWild = {
		from: { reel: number; row: number };
		to: { reel: number; row: number; multiplier: number };
		progress: Tween<number>;
		alpha: Tween<number>;
	};

	let activeReelEffect = $state<OutlawEffect | null>(null);
	let shootingWilds = $state<ShootingWild[]>([]);

	context.eventEmitter.subscribeOnMount({
		outlawFeatureStart: ({ reel }) => {
			// Create reel effect
			activeReelEffect = {
				reel,
				alpha: new Tween(1),
				scale: new Tween(1),
			};

			// Flash effect
			activeReelEffect.alpha.set(0.8, { duration: 150 });
			activeReelEffect.scale.set(1.1, { duration: 200 });
			activeReelEffect.alpha.set(1, { duration: 150 });
			activeReelEffect.scale.set(1, { duration: 200 });
		},
		outlawReelExpand: ({ reel }) => {
			// Clean up reel effect when expanding
			if (activeReelEffect?.reel === reel) {
				activeReelEffect = null;
			}
		},
		outlawShootWilds: async ({ shotWilds }) => {
			// Get source reel (the reel where the Outlaw symbol is)
			const sourceReel = activeReelEffect?.reel ?? 0;

			// Create shooting wild animations
			shootingWilds = shotWilds.map((target) => {
				const shootingWild: ShootingWild = {
					from: { reel: sourceReel, row: 2 }, // symbolIndexOfBoard 2 = middle visible row
					to: { reel: target.reel, row: target.row, multiplier: target.multiplier },
					progress: new Tween(0),
					alpha: new Tween(1),
				};
				return shootingWild;
			});

			// Animate wilds shooting from source to targets
			const animations = shootingWilds.map(async (shootingWild) => {
				// Animate progress from 0 to 1
				await shootingWild.progress.set(1, { duration: 600 });
				// Fade out quickly
				await shootingWild.alpha.set(0, { duration: 100 });
			});

			await Promise.all(animations);

			// Clean up
			shootingWilds = [];
		},
		outlawWildsPlace: () => {
			// Clean up any remaining shooting wilds
			shootingWilds = [];
		},
	});
</script>

<BoardContainer>
	{#if activeReelEffect}
		{@const x = getSymbolX(activeReelEffect.reel) + SYMBOL_SIZE * 0.5}
		{@const y = getSymbolY(2)}
		{@const radius = SYMBOL_SIZE * 0.5}
		<Container x={x} y={y}>
			<!-- Flash effect at source reel -->
			<Graphics
				alpha={activeReelEffect.alpha.current}
				scale={activeReelEffect.scale.current}
				draw={(g: any) => {
					g.clear();
					g.beginFill(0xff6b00, 0.7); // Orange/red color
					g.drawCircle(0, 0, radius);
					g.endFill();
					g.beginFill(0xffaa00, 0.5);
					g.drawCircle(0, 0, radius * 1.2);
					g.endFill();
				}}
			/>
		</Container>
	{/if}

	{#each shootingWilds as shootingWild (shootingWild)}
		{@const fromX = getSymbolX(shootingWild.from.reel) + SYMBOL_SIZE * 0.5}
		{@const fromY = getSymbolY(shootingWild.from.row)}
		{@const toX = getSymbolX(shootingWild.to.reel) + SYMBOL_SIZE * 0.5}
		{@const toY = getSymbolY(shootingWild.to.row - 1)}
		{@const currentX = fromX + (toX - fromX) * shootingWild.progress.current}
		{@const currentY = fromY + (toY - fromY) * shootingWild.progress.current}
		<Container x={currentX} y={currentY} alpha={shootingWild.alpha.current}>
			<!-- Shooting wild indicator -->
			<Graphics
				draw={(g: any) => {
					g.clear();
					g.beginFill(0xffff00, 0.9); // Bright yellow for wild
					g.drawCircle(0, 0, SYMBOL_SIZE * 0.3);
					g.endFill();
					g.lineStyle(3, 0xffffff, 1);
					g.drawCircle(0, 0, SYMBOL_SIZE * 0.3);
				}}
			/>
		</Container>
	{/each}
</BoardContainer>

