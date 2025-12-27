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
