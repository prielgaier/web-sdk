import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({ revealEvent: bookEvent });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// Filter invalid positions
		// With include_padding=True, reveal board has 7 rows per reel:
		//   row 0 = top padding, rows 1-5 = visible, row 6 = bottom padding
		// Win positions are offset by +1, so they point to rows 1-5 (visible rows)
		// The frontend reel stores all 7 symbols (indices 0-6), so we accept rows 1-5
		const allPositions = _.flatten(bookEvent.wins.map((win) => win.positions));
		const invalidPositions: string[] = [];
		const validPositions = allPositions.filter((position) => {
			if (position.reel < 0 || position.reel >= 5) {
				invalidPositions.push(`reel ${position.reel}`);
				return false;
			}
			// Accept rows 1-5 (visible rows in 7-row reveal board with padding)
			if (position.row < 1 || position.row > 5) {
				invalidPositions.push(`row ${position.row}@reel${position.reel}`);
				return false;
			}
			return true;
		});
		if (invalidPositions.length > 0) {
			console.warn(
				`winInfo: Filtered ${invalidPositions.length} invalid position(s) (reveal board has 7 rows per reel: row 0=top padding, rows 1-5=visible, row 6=bottom padding. Win positions should be rows 1-5)`,
			);
		}
		
		const promise1 = async () => {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
			await animateSymbols({ positions: validPositions });
		};

		const promise2 = async () => {
			await eventEmitter.broadcastAsync({
				type: 'showClusterWinAmounts',
				wins: bookEvent.wins
					.filter((win) => win.meta?.overlay) // Filter out wins without overlay
					.map((win) => {
						return {
							win: win.meta.winWithoutMult,
							mult: win.meta.globalMult,
							result: win.meta.winWithoutMult * win.meta.globalMult,
							reel: win.meta.overlay.reel,
							row: win.meta.overlay.row,
						};
					}),
			});
		};

		await Promise.all([promise1(), promise2()]);
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: false,
			});
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		try {
			await Promise.race([
				animateSymbols({ positions: bookEvent.positions }),
				new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
			]);
		} catch (error) {
			console.warn('Scatter animation timeout or error:', error);
		}
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'uiHide' }),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('UI hide timeout:', error);
		}
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'transition' }),
				new Promise((resolve) => setTimeout(resolve, 2000)),
			]);
		} catch (error) {
			console.warn('Transition timeout:', error);
		}
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'freeSpinIntroUpdate',
					totalFreeSpins: bookEvent.totalFs,
				}),
				new Promise((resolve) => setTimeout(resolve, 2000)),
			]);
		} catch (error) {
			console.warn('Free spin intro update timeout:', error);
		}
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'globalMultiplierUpdate',
					multiplier: 1, // resets when multiplier === 1
				}),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('Global multiplier update timeout:', error);
		}
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'uiShow' }),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('UI show timeout:', error);
		}
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'drawerButtonShow' }),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('Drawer button show timeout:', error);
		}
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		try {
			await Promise.race([
				animateSymbols({ positions: bookEvent.positions }),
				new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
			]);
		} catch (error) {
			console.warn('Scatter animation timeout or error:', error);
		}
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'uiHide' }),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('UI hide timeout:', error);
		}
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'transition' }),
				new Promise((resolve) => setTimeout(resolve, 2000)),
			]);
		} catch (error) {
			console.warn('Transition timeout:', error);
		}
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'freeSpinIntroUpdate',
					totalFreeSpins: bookEvent.totalFs,
				}),
				new Promise((resolve) => setTimeout(resolve, 2000)),
			]);
		} catch (error) {
			console.warn('Free spin intro update timeout:', error);
		}
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'globalMultiplierUpdate',
					multiplier: 1, // resets when multiplier === 1
				}),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('Global multiplier update timeout:', error);
		}
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({ type: 'uiShow' }),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.warn('UI show timeout:', error);
		}
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
	},
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		if (bookEvent.globalMult === 1) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.globalMult, // resets when multiplier === 1
		});
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
		
		// Filter invalid positions before passing to component
		// Board is 5x5 (5 reels, indices 0-4)
		const invalidPositions: string[] = [];
		const validExplodingPositions = bookEvent.explodingSymbols.filter((position) => {
			if (position.reel < 0 || position.reel >= 5) {
				invalidPositions.push(`reel ${position.reel}`);
				return false;
			}
			// Row validation will be done in component based on actual tumble board state
			// But filter out obviously invalid rows (negative or very large)
			if (position.row < 0 || position.row > 20) {
				invalidPositions.push(`row ${position.row}@reel${position.reel}`);
				return false;
			}
			return true;
		});
		if (invalidPositions.length > 0) {
			console.warn(
				`tumbleBoard: Filtered ${invalidPositions.length} invalid position(s) (board is 5x5, valid: reels 0-4)`,
			);
		}
		
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: validExplodingPositions,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((tumbleSymbol) => tumbleSymbol.rawSymbol)),
		});
		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	updateGrid: async (bookEvent: BookEventOfType<'updateGrid'>) => {
		eventEmitter.broadcast({ type: 'multiplierGridShow' });
		eventEmitter.broadcast({ type: 'multiplierGridUpdate', grid: bookEvent.gridMultipliers });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		eventEmitter.broadcast({ type: 'multiplierGridClear' });
		eventEmitter.broadcast({ type: 'multiplierGridHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	// Duel At Dawn specific handlers
	vsDuel: async (bookEvent: BookEventOfType<'vsDuel'>) => {
		// VS symbol expands to wild reel and triggers duel
		eventEmitter.broadcast({
			type: 'vsDuelStart',
			reel: bookEvent.reel,
			multiplier: bookEvent.multiplier,
		});
		// Play duel animation (with timeout to prevent hanging)
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'vsDuelAnimate',
					reel: bookEvent.reel,
				}),
				new Promise((resolve) => setTimeout(resolve, 2000)), // 2 second timeout
			]);
		} catch (error) {
			console.warn('VS Duel animation timeout or error:', error);
		}
		// Expand reel to wilds
		eventEmitter.broadcast({
			type: 'vsReelExpand',
			reel: bookEvent.reel,
			multiplier: bookEvent.multiplier,
		});
	},
	outlawFeature: async (bookEvent: BookEventOfType<'outlawFeature'>) => {
		// Outlaw symbol expands to wild reel and shoots random wilds
		eventEmitter.broadcast({
			type: 'outlawFeatureStart',
			reel: bookEvent.reel,
		});
		// Expand reel to wilds
		eventEmitter.broadcast({
			type: 'outlawReelExpand',
			reel: bookEvent.reel,
		});
		// Shoot wilds animation (with timeout to prevent hanging)
		try {
			await Promise.race([
				eventEmitter.broadcastAsync({
					type: 'outlawShootWilds',
					shotWilds: bookEvent.shotWilds,
				}),
				new Promise((resolve) => setTimeout(resolve, 2000)), // 2 second timeout
			]);
		} catch (error) {
			console.warn('Outlaw shoot wilds animation timeout or error:', error);
		}
		// Place wilds on board
		eventEmitter.broadcast({
			type: 'outlawWildsPlace',
			shotWilds: bookEvent.shotWilds,
		});
	},
	freegameMode: async (bookEvent: BookEventOfType<'freegameMode'>) => {
		// Set free game mode (Wild Wild West or Dusk 'Til Dawn)
		eventEmitter.broadcast({
			type: 'freegameModeSet',
			mode: bookEvent.mode,
		});
		// Show mode-specific UI/animation
		if (bookEvent.mode === 'dusk_til_dawn') {
			eventEmitter.broadcast({ type: 'duskTilDawnIntro' });
		} else {
			eventEmitter.broadcast({ type: 'wildWildWestIntro' });
		}
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
