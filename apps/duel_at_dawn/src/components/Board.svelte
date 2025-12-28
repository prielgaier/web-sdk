<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			const getPromises = () =>
				symbolPositions
					.filter((position) => {
						// Validate position is within bounds
						if (position.reel < 0 || position.reel >= context.stateGame.board.length) {
							console.warn(`Invalid reel index: ${position.reel}`);
							return false;
						}
						const reel = context.stateGame.board[position.reel];
						if (!reel || !reel.reelState) {
							console.warn(`Reel or reelState is undefined at reel ${position.reel}`);
							return false;
						}
						const symbols = reel.reelState.symbols;
						if (!symbols || position.row < 0 || position.row >= symbols.length) {
							console.warn(
								`Invalid row index: ${position.row} (reel ${position.reel} has ${symbols?.length || 0} symbols)`,
							);
							return false;
						}
						return true;
					})
					.map(async (position) => {
						const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
						reelSymbol.symbolState = 'win';
						// Add timeout to prevent hanging if animation doesn't complete
						await Promise.race([
							waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
							new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
						]);
						reelSymbol.symbolState = 'postWinStatic';
					});

			await Promise.all(getPromises());
		},
		vsReelExpand: ({ reel, multiplier }) => {
			// Convert all visible symbols on the reel (rows 1-5) to wilds with multiplier
			// The board has 7 rows (0-6): row 0 = top padding, rows 1-5 = visible, row 6 = bottom padding
			const reelSymbols = context.stateGame.board[reel]?.reelState?.symbols;
			if (!reelSymbols) {
				console.warn(`Invalid reel index: ${reel}`);
				return;
			}

			// Convert visible rows (1-5) to wilds with multiplier
			for (let row = 1; row <= 5; row++) {
				if (row < reelSymbols.length) {
					reelSymbols[row].rawSymbol = {
						name: 'W',
						multiplier: multiplier,
					};
				}
			}
		},
		outlawReelExpand: ({ reel }) => {
			// Convert all visible symbols on the reel (rows 1-5) to wilds
			const reelSymbols = context.stateGame.board[reel]?.reelState?.symbols;
			if (!reelSymbols) {
				console.warn(`Invalid reel index: ${reel}`);
				return;
			}

			// Convert visible rows (1-5) to wilds
			for (let row = 1; row <= 5; row++) {
				if (row < reelSymbols.length) {
					reelSymbols[row].rawSymbol = {
						name: 'W',
					};
				}
			}
		},
		outlawWildsPlace: ({ shotWilds }) => {
			// Place wilds at the specified positions with their multipliers
			shotWilds.forEach(({ reel, row, multiplier }) => {
				// Validate position (row should be 1-5 for visible rows)
				if (reel < 0 || reel >= context.stateGame.board.length) {
					console.warn(`Invalid reel index: ${reel}`);
					return;
				}
				const reelSymbols = context.stateGame.board[reel]?.reelState?.symbols;
				if (!reelSymbols || row < 1 || row > 5 || row >= reelSymbols.length) {
					console.warn(`Invalid row index: ${row} for reel ${reel}`);
					return;
				}

				// Place wild with multiplier at the position
				reelSymbols[row].rawSymbol = {
					name: 'W',
					multiplier: multiplier,
				};
			});
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
