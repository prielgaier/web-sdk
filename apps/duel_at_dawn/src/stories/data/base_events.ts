export default {
	reveal: {
		type: 'reveal',
		board: [
			// 5x5 grid for Duel At Dawn (5 reels, 5 rows each)
			[
				{ name: 'L1' },
				{ name: 'H1' },
				{ name: 'L1' },
				{ name: 'L2' },
				{ name: 'L2' },
			],
			[
				{ name: 'L2' },
				{ name: 'L2' },
				{ name: 'L3' },
				{ name: 'H2' },
				{ name: 'H2' },
			],
			[
				{ name: 'L3' },
				{ name: 'H3' },
				{ name: 'L1' },
				{ name: 'H4' },
				{ name: 'H4' },
			],
			[
				{ name: 'H4' },
				{ name: 'L1' },
				{ name: 'H2' },
				{ name: 'H2' },
				{ name: 'L3' },
			],
			[
				{ name: 'L1' },
				{ name: 'H1' },
				{ name: 'H3' },
				{ name: 'H1' },
				{ name: 'H2' },
			],
		],
		paddingPositions: [216, 205, 195, 16, 65], // 5 reels
		gameType: 'basegame',
		anticipation: [0, 0, 0, 0, 0], // 5 reels
	},
	setTotalWin: {
		type: 'setTotalWin',
		amount: 1000,
	},
	finalWin: {
		type: 'finalWin',
		amount: 0,
	},
	winInfo: {
		type: 'winInfo',
		totalWin: 220,
		wins: [
			{
				symbol: 'L3',
				win: 20,
				positions: [
					{ reel: 1, row: 2 },
					{ reel: 2, row: 0 },
					{ reel: 3, row: 4 },
				],
				meta: {
					globalMult: 1,
					clusterMult: 1,
					winWithoutMult: 0.2,
					overlay: { reel: 2, row: 0 },
				},
			},
			{
				symbol: 'H2',
				win: 200,
				positions: [
					{ reel: 1, row: 3 },
					{ reel: 1, row: 4 },
					{ reel: 2, row: 3 },
					{ reel: 3, row: 2 },
					{ reel: 3, row: 1 },
				],
				meta: {
					globalMult: 1,
					clusterMult: 1,
					winWithoutMult: 2.0,
					overlay: { reel: 2, row: 3 },
				},
			},
		],
	},
	updateTumbleWin: {
		type: 'updateTumbleWin',
		amount: 220,
	},
	tumbleBoard: {
		type: 'tumbleBoard',
		newSymbols: [
			[],
			[{ name: 'H2' }],
			[{ name: 'L1' }, { name: 'L3' }],
			[{ name: 'H3' }, { name: 'H4' }],
			[{ name: 'L1' }],
		],
		explodingSymbols: [
			{ reel: 1, row: 3 },
			{ reel: 2, row: 2 },
			{ reel: 2, row: 1 },
			{ reel: 3, row: 2 },
			{ reel: 3, row: 1 },
			{ reel: 4, row: 3 },
		],
	},
	setWin: {
		type: 'setWin',
		amount: 550,
		winLevel: 5,
	},
	freeSpinTrigger: {
		type: 'freeSpinTrigger',
		totalFs: 10,
		positions: [
			{ reel: 0, row: 2 },
			{ reel: 1, row: 1 },
			{ reel: 2, row: 3 },
			{ reel: 3, row: 0 },
		],
	},
	updateFreeSpin: {
		type: 'updateFreeSpin',
		amount: 1,
		total: 10,
	},
	updateGlobalMult: {
		type: 'updateGlobalMult',
		globalMult: 3,
	},
	updateGrid: {
		type: 'updateGrid',
		gridMultipliers: [
			[0, 0, 1, 0, 0],
			[0, 1, 1, 1, 0],
			[1, 1, 2, 1, 1],
			[0, 1, 1, 1, 0],
			[0, 0, 1, 0, 0],
		],
	},
	freeSpinEnd: {
		type: 'freeSpinEnd',
		amount: 94270,
		winLevel: 9,
	},
	freeSpinRetrigger: {
		type: 'freeSpinRetrigger',
		totalFs: 20,
		positions: [
			{ reel: 0, row: 3 },
			{ reel: 2, row: 2 },
			{ reel: 4, row: 1 },
		],
	},
	// Duel At Dawn specific events
	vsDuel: {
		index: 0,
		type: 'vsDuel',
		reel: 2,
		multiplier: 10,
	},
	outlawFeature: {
		index: 0,
		type: 'outlawFeature',
		reel: 1,
		numWilds: 3,
		shotWilds: [
			{
				reel: 0,
				row: 2,
				multiplier: 5,
			},
			{
				reel: 3,
				row: 1,
				multiplier: 3,
			},
			{
				reel: 4,
				row: 3,
				multiplier: 2,
			},
		],
	},
	freegameMode: {
		index: 0,
		type: 'freegameMode',
		mode: 'wild_wild_west',
	},
	freegameModeDusk: {
		index: 0,
		type: 'freegameMode',
		mode: 'dusk_til_dawn',
	},
};
