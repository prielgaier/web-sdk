export default {
	providerName: 'sample_provider',
	gameName: 'duel_at_dawn',
	gameID: 'duel_at_dawn',
	rtp: 0.97,
	numReels: 5,
	numRows: [5, 5, 5, 5, 5], // 5x5 grid
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.97,
			max_win: 5000.0,
		},
	},
	symbols: {
		W: {
			paytable: {
				3: 10,
				4: 20,
				5: 50,
			},
			special_properties: ['wild', 'multiplier'],
		},
		H1: {
			paytable: {
				3: 10,
				4: 20,
				5: 50,
			},
		},
		H2: {
			paytable: {
				3: 6,
				4: 12,
				5: 30,
			},
		},
		H3: {
			paytable: {
				3: 4,
				4: 8,
				5: 20,
			},
		},
		H4: {
			paytable: {
				3: 3,
				4: 6,
				5: 15,
			},
		},
		H5: {
			paytable: {
				3: 2,
				4: 4,
				5: 10,
			},
		},
		L1: {
			paytable: {
				3: 1,
				4: 2,
				5: 5,
			},
		},
		L2: {
			paytable: {
				3: 0.7,
				4: 1.5,
				5: 3,
			},
		},
		L3: {
			paytable: {
				3: 0.5,
				4: 1,
				5: 2,
			},
		},
		L4: {
			paytable: {
				3: 0.3,
				4: 0.7,
				5: 1.5,
			},
		},
		S: {
			paytable: null,
			special_properties: ['scatter'],
		},
		VS: {
			paytable: null,
			special_properties: ['vs'], // VS symbol for DuelReels feature
		},
		O: {
			paytable: null,
			special_properties: ['outlaw'], // Outlaw symbol
		},
		FS: {
			paytable: null,
			special_properties: ['fs_scatter'], // Free spin scatter
		},
	},
	paddingReels: {
		basegame: '',
		freegame: '',
	},
};
