import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventClusterWinAmounts } from '../components/ClusterWinAmounts.svelte';
import type { EmitterEventTumbleBoard } from '../components/TumbleBoard.svelte';
import type { EmitterEventTumbleWinAmount } from '../components/TumbleWinAmount.svelte';
import type { EmitterEventGlobalMultiplier } from '../components/GlobalMultiplier.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventMultiplierGrid } from '../components/MultiplierGrid.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';

// VS Duel events
export type EmitterEventVsDuel =
	| { type: 'vsDuelStart'; reel: number; multiplier: number }
	| { type: 'vsDuelAnimate'; reel: number }
	| { type: 'vsReelExpand'; reel: number; multiplier: number };

// Outlaw Feature events
export type EmitterEventOutlaw =
	| { type: 'outlawFeatureStart'; reel: number }
	| { type: 'outlawReelExpand'; reel: number }
	| { type: 'outlawShootWilds'; shotWilds: { reel: number; row: number; multiplier: number }[] }
	| { type: 'outlawWildsPlace'; shotWilds: { reel: number; row: number; multiplier: number }[] };

// Freegame Mode events
export type EmitterEventFreegameMode =
	| { type: 'freegameModeSet'; mode: 'wild_wild_west' | 'dusk_til_dawn' }
	| { type: 'wildWildWestIntro' }
	| { type: 'duskTilDawnIntro' };

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventClusterWinAmounts
	| EmitterEventTumbleBoard
	| EmitterEventTumbleWinAmount
	| EmitterEventGlobalMultiplier
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventMultiplierGrid
	| EmitterEventTransition
	| EmitterEventVsDuel
	| EmitterEventOutlaw
	| EmitterEventFreegameMode;
