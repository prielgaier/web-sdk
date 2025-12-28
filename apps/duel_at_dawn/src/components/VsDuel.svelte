<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Graphics, BitmapText } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// Possible duel multiplier values (2x to 200x)
	const DUEL_MULT_VALUES = [2, 3, 4, 5, 10, 20, 50, 100, 200];

	function getRandomDuelMultiplier(winner: number): number {
		// Generate a random opponent multiplier (different from winner)
		const opponents = DUEL_MULT_VALUES.filter((v) => v !== winner);
		return opponents[Math.floor(Math.random() * opponents.length)];
	}

	// Row indices for a 5-row reel (with padding, visible rows are 1-5)
	const TOP_ROW = 1; // Top visible row
	const MIDDLE_ROW = 3; // Middle visible row
	const BOTTOM_ROW = 5; // Bottom visible row

	type VsDuelEffect = {
		reel: number;
		winnerMultiplier: number;
		opponentMultiplier: number;
		winnerAtTop: boolean; // True if winner starts at top, false if at bottom
		topY: Tween<number>;
		bottomY: Tween<number>;
		topAlpha: Tween<number>;
		bottomAlpha: Tween<number>;
		topScale: Tween<number>;
		bottomScale: Tween<number>;
		state: 'dueling' | 'revealing' | 'complete';
		oncomplete: () => void;
	};

	let activeEffects = $state<VsDuelEffect[]>([]);

	context.eventEmitter.subscribeOnMount({
		vsDuelStart: ({ reel, multiplier }) => {
			// Remove any existing effect for this reel
			activeEffects = activeEffects.filter((e) => e.reel !== reel);

			// Generate opponent multiplier
			const opponentMult = getRandomDuelMultiplier(multiplier);
			// Randomly assign winner to top or bottom
			const winnerAtTop = Math.random() > 0.5;

			// Create a new VS Duel effect
			const effect: VsDuelEffect = {
				reel,
				winnerMultiplier: multiplier,
				opponentMultiplier: opponentMult,
				winnerAtTop,
				topY: new Tween(getSymbolY(TOP_ROW)),
				bottomY: new Tween(getSymbolY(BOTTOM_ROW)),
				topAlpha: new Tween(1),
				bottomAlpha: new Tween(1),
				topScale: new Tween(1),
				bottomScale: new Tween(1),
				state: 'dueling',
				oncomplete: () => {
					// Remove effect when animation completes
					activeEffects = activeEffects.filter((e) => e !== effect);
				},
			};
			activeEffects = [...activeEffects, effect];
		},
		vsDuelAnimate: async ({ reel }) => {
			// Find the active effect for this reel
			const effect = activeEffects.find((e) => e.reel === reel);
			if (!effect) {
				await waitForTimeout(1000);
				return;
			}

			const topYPos = getSymbolY(TOP_ROW);
			const middleYPos = getSymbolY(MIDDLE_ROW);
			const bottomYPos = getSymbolY(BOTTOM_ROW);

			// Dueling phase: shake/compete animation (move toward each other)
			effect.state = 'dueling';
			for (let i = 0; i < 3; i++) {
				// Move top down a bit, bottom up a bit (toward each other)
				const shakeDistance = SYMBOL_SIZE * 0.3;
				await Promise.all([
					effect.topY.set(topYPos + shakeDistance, { duration: 150 }),
					effect.topScale.set(1.2, { duration: 150 }),
					effect.bottomY.set(bottomYPos - shakeDistance, { duration: 150 }),
					effect.bottomScale.set(1.2, { duration: 150 }),
				]);
				await Promise.all([
					effect.topY.set(topYPos, { duration: 150 }),
					effect.topScale.set(1, { duration: 150 }),
					effect.bottomY.set(bottomYPos, { duration: 150 }),
					effect.bottomScale.set(1, { duration: 150 }),
				]);
			}

			// Revealing phase: move winner to middle, loser fades out
			effect.state = 'revealing';
			if (effect.winnerAtTop) {
				// Winner is at top, move it to middle and fade bottom
				await Promise.all([
					effect.topY.set(middleYPos, { duration: 400 }),
					effect.topScale.set(1.3, { duration: 400 }),
					effect.bottomAlpha.set(0, { duration: 400 }),
					effect.bottomScale.set(0.5, { duration: 400 }),
				]);
			} else {
				// Winner is at bottom, move it to middle and fade top
				await Promise.all([
					effect.bottomY.set(middleYPos, { duration: 400 }),
					effect.bottomScale.set(1.3, { duration: 400 }),
					effect.topAlpha.set(0, { duration: 400 }),
					effect.topScale.set(0.5, { duration: 400 }),
				]);
			}

			// Final pulse of winner at middle
			if (effect.winnerAtTop) {
				await Promise.all([
					effect.topScale.set(1.5, { duration: 200 }),
					effect.topAlpha.set(1, { duration: 200 }),
				]);
				await Promise.all([
					effect.topScale.set(1.2, { duration: 200 }),
					effect.topAlpha.set(1, { duration: 200 }),
				]);
			} else {
				await Promise.all([
					effect.bottomScale.set(1.5, { duration: 200 }),
					effect.bottomAlpha.set(1, { duration: 200 }),
				]);
				await Promise.all([
					effect.bottomScale.set(1.2, { duration: 200 }),
					effect.bottomAlpha.set(1, { duration: 200 }),
				]);
			}

			effect.state = 'complete';
			effect.oncomplete();
		},
		vsReelExpand: ({ reel }) => {
			// Clean up effect when reel expands
			activeEffects = activeEffects.filter((e) => e.reel !== reel);
		},
	});
</script>

<BoardContainer>
	{#each activeEffects as effect (effect.reel)}
		{@const x = getSymbolX(effect.reel) + SYMBOL_SIZE * 0.5}
		{@const radius = SYMBOL_SIZE * 0.4}
		<Container x={x}>
			<!-- Top multiplier -->
			<Container y={effect.topY.current} alpha={effect.topAlpha.current}>
				<Graphics
					scale={effect.topScale.current}
					draw={(g: any) => {
						g.clear();
						const isWinner = effect.winnerAtTop;
						g.beginFill(isWinner ? 0xffd700 : 0x888888, 0.8);
						g.drawCircle(0, 0, radius);
						g.endFill();
						if (isWinner) {
							g.lineStyle(4, 0xffffff, 1);
							g.drawCircle(0, 0, radius);
						}
					}}
				/>
				<BitmapText
					anchor={0.5}
					text={`${effect.winnerAtTop ? effect.winnerMultiplier : effect.opponentMultiplier}X`}
					style={{
						fontFamily: 'gold',
						fontSize: SYMBOL_SIZE * 0.4,
						fill: 0xffffff,
					}}
					scale={effect.topScale.current}
				/>
			</Container>

			<!-- VS text in middle (fades during reveal) -->
			{#if effect.state === 'dueling'}
				<Container y={getSymbolY(MIDDLE_ROW)}>
					<BitmapText
						anchor={0.5}
						text="VS"
						style={{
							fontFamily: 'gold',
							fontSize: SYMBOL_SIZE * 0.3,
							fill: 0xffffff,
						}}
					/>
				</Container>
			{/if}

			<!-- Bottom multiplier -->
			<Container y={effect.bottomY.current} alpha={effect.bottomAlpha.current}>
				<Graphics
					scale={effect.bottomScale.current}
					draw={(g: any) => {
						g.clear();
						const isWinner = !effect.winnerAtTop;
						g.beginFill(isWinner ? 0xffd700 : 0x888888, 0.8);
						g.drawCircle(0, 0, radius);
						g.endFill();
						if (isWinner) {
							g.lineStyle(4, 0xffffff, 1);
							g.drawCircle(0, 0, radius);
						}
					}}
				/>
				<BitmapText
					anchor={0.5}
					text={`${!effect.winnerAtTop ? effect.winnerMultiplier : effect.opponentMultiplier}X`}
					style={{
						fontFamily: 'gold',
						fontSize: SYMBOL_SIZE * 0.4,
						fill: 0xffffff,
					}}
					scale={effect.bottomScale.current}
				/>
			</Container>
		</Container>
	{/each}
</BoardContainer>

