// Adapted from csTimer gsolver.js (GPL-3.0). UI-independent method solver primitives.
	function appendSuffix(moves, suffix) {
		var ret = {};
		suffix = suffix || " 2'";
		for (var m in moves) {
			for (var i = 0; i < suffix.length; i++) {
				ret[m + suffix[i]] = moves[m];
			}
		}
		return ret;
	}

	function solveParallel(doMove, solvs, maps, fmov, mask, MAXL) {
		var solcur;
		out: for (var maxl = 0; maxl < MAXL + 1; maxl++) {
			for (var solved in solvs) {
				if ((maps[solved] | mask) != maps[solved]) {
					continue;
				}
				var state = stateInit(doMove, solved);
				solcur = solvs[solved].search(state, 0, maxl);
				if (solcur != undefined) {
					mask |= maps[solved];
					break out;
				}
				for (var m = 0; m < fmov.length; m++) {
					var fstate = doMove(state, fmov[m]);
					solcur = solvs[solved].search(fstate, 0, maxl);
					if (solcur != undefined) {
						solcur.unshift(fmov[m]);
						mask |= maps[solved];
						break out;
					}
				}
			}
		}
		return [solcur, mask];
	}

		var U1 = 0,
			U2 = 1,
			U3 = 2,
			U4 = 3,
			U5 = 4,
			U6 = 5,
			U7 = 6,
			U8 = 7,
			U9 = 8,
			R1 = 9,
			R2 = 10,
			R3 = 11,
			R4 = 12,
			R5 = 13,
			R6 = 14,
			R7 = 15,
			R8 = 16,
			R9 = 17,
			F1 = 18,
			F2 = 19,
			F3 = 20,
			F4 = 21,
			F5 = 22,
			F6 = 23,
			F7 = 24,
			F8 = 25,
			F9 = 26,
			D1 = 27,
			D2 = 28,
			D3 = 29,
			D4 = 30,
			D5 = 31,
			D6 = 32,
			D7 = 33,
			D8 = 34,
			D9 = 35,
			L1 = 36,
			L2 = 37,
			L3 = 38,
			L4 = 39,
			L5 = 40,
			L6 = 41,
			L7 = 42,
			L8 = 43,
			L9 = 44,
			B1 = 45,
			B2 = 46,
			B3 = 47,
			B4 = 48,
			B5 = 49,
			B6 = 50,
			B7 = 51,
			B8 = 52,
			B9 = 53;

		var moveData = [
			[[U1, U3, U9, U7], [U2, U6, U8, U4], [F1, L1, B1, R1], [F2, L2, B2, R2], [F3, L3, B3, R3]], // U
			[[R1, R3, R9, R7], [R2, R6, R8, R4], [U3, B7, D3, F3], [U6, B4, D6, F6], [U9, B1, D9, F9]], // R
			[[F1, F3, F9, F7], [F2, F6, F8, F4], [U7, R1, D3, L9], [U8, R4, D2, L6], [U9, R7, D1, L3]], // F
			[[D1, D3, D9, D7], [D2, D6, D8, D4], [F7, R7, B7, L7], [F8, R8, B8, L8], [F9, R9, B9, L9]], // D
			[[L1, L3, L9, L7], [L2, L6, L8, L4], [U1, F1, D1, B9], [U4, F4, D4, B6], [U7, F7, D7, B3]], // L
			[[B1, B3, B9, B7], [B2, B6, B8, B4], [U3, L1, D7, R9], [U2, L4, D8, R6], [U1, L7, D9, R3]], // B
			[[U1, U3, U9, U7], [U2, U6, U8, U4], [F1, L1, B1, R1], [F2, L2, B2, R2], [F3, L3, B3, R3],
			 [F4, L4, B4, R4], [F5, L5, B5, R5], [F6, L6, B6, R6]], // u = Uw
			[[R1, R3, R9, R7], [R2, R6, R8, R4], [U3, B7, D3, F3], [U6, B4, D6, F6], [U9, B1, D9, F9],
			 [U2, B8, D2, F2], [U5, B5, D5, F5], [U8, B2, D8, F8]], // r = Rw
			[[F1, F3, F9, F7], [F2, F6, F8, F4], [U7, R1, D3, L9], [U8, R4, D2, L6], [U9, R7, D1, L3],
			 [U4, R2, D6, L8], [U5, R5, D5, L5], [U6, R8, D4, L2]], // f = Fw
			[[D1, D3, D9, D7], [D2, D6, D8, D4], [F7, R7, B7, L7], [F8, R8, B8, L8], [F9, R9, B9, L9],
			 [F4, R4, B4, L4], [F5, R5, B5, L5], [F6, R6, B6, L6]], // d = Dw
			[[L1, L3, L9, L7], [L2, L6, L8, L4], [U1, F1, D1, B9], [U4, F4, D4, B6], [U7, F7, D7, B3],
			 [U2, F2, D2, B8], [U5, F5, D5, B5], [U8, F8, D8, B2]], // l = Lw
			[[B1, B3, B9, B7], [B2, B6, B8, B4], [U3, L1, D7, R9], [U2, L4, D8, R6], [U1, L7, D9, R3],
			 [U6, L2, D4, R8], [U5, L5, D5, R5], [U4, L8, D6, R2]], // b = Bw
			[[U2, F2, D2, B8], [U5, F5, D5, B5], [U8, F8, D8, B2]], // M
			[[F4, R4, B4, L4], [F5, R5, B5, L5], [F6, R6, B6, L6]], // E
			[[U4, R2, D6, L8], [U5, R5, D5, L5], [U6, R8, D4, L2]], // S
			[[R1, R3, R9, R7], [R2, R6, R8, R4], [U3, B7, D3, F3], [U6, B4, D6, F6], [U9, B1, D9, F9],
			 [L1, L7, L9, L3], [L2, L4, L8, L6], [U1, B9, D1, F1], [U4, B6, D4, F4], [U7, B3, D7, F7],
			 [U2, B8, D2, F2], [U5, B5, D5, F5], [U8, B2, D8, F8]], // x
			[[U1, U3, U9, U7], [U2, U6, U8, U4], [F1, L1, B1, R1], [F2, L2, B2, R2], [F3, L3, B3, R3],
			 [D1, D7, D9, D3], [D2, D4, D8, D6], [F7, L7, B7, R7], [F8, L8, B8, R8], [F9, L9, B9, R9],
			 [F4, L4, B4, R4], [F5, L5, B5, R5], [F6, L6, B6, R6]], // y
			[[F1, F3, F9, F7], [F2, F6, F8, F4], [U7, R1, D3, L9], [U8, R4, D2, L6], [U9, R7, D1, L3],
			 [B1, B7, B9, B3], [B2, B4, B8, B6], [U3, R9, D7, L1], [U2, R6, D8, L4], [U1, R3, D9, L7],
			 [U4, R2, D6, L8], [U5, R5, D5, L5], [U6, R8, D4, L2]] // z
		];

		var moves = appendSuffix({
			"U": 0x00,
			"R": 0x11,
			"F": 0x22,
			"D": 0x30,
			"L": 0x41,
			"B": 0x52
		});

		var movesWithoutD = appendSuffix({
			"U": 0x00,
			"R": 0x11,
			"F": 0x22,
			"L": 0x41,
			"B": 0x52
		});

		var movesRouxSB = appendSuffix({
			"U": 0x00,
			"R": 0x11,
			"M": 0x61,
			"r": 0x71
		});

		var movesZZF2L = appendSuffix({
			"U": 0x00,
			"R": 0x11,
			"L": 0x41
		});

		function cubeMove(state, move) {
			var ret = state.split('');
			var swaps = moveData["URFDLBurfdlbMESxyz".indexOf(move[0])];
			var pow = "? 2'".indexOf(move[1]);
			for (var i = 0; i < swaps.length; i++) {
				mathlib.acycle(ret, swaps[i], pow);
			}
			return ret.join('');
		}

		var cfmeta = [
			{
				'move': moves,
				'maxl': 8,
				'head': "Cross",
				'step': {
					"----U--------R--R-----F--F--D-DDD-D-----L--L-----B--B-": 0x0
				}
			}, {
				'move': movesWithoutD,
				'head': "F2L-1",
				'step': {
					"----U-------RR-RR-----FF-FF-DDDDD-D-----L--L-----B--B-": 0x1,
					"----U--------R--R----FF-FF-DD-DDD-D-----LL-LL----B--B-": 0x2,
					"----U--------RR-RR----F--F--D-DDD-DD----L--L----BB-BB-": 0x4,
					"----U--------R--R-----F--F--D-DDDDD----LL-LL-----BB-BB": 0x8
				}
			}, {
				'move': movesWithoutD,
				'head': "F2L-2",
				'step': {
					"----U-------RR-RR----FFFFFFDDDDDD-D-----LL-LL----B--B-": 0x3,
					"----U-------RRRRRR----FF-FF-DDDDD-DD----L--L----BB-BB-": 0x5,
					"----U--------RR-RR---FF-FF-DD-DDD-DD----LL-LL---BB-BB-": 0x6,
					"----U-------RR-RR-----FF-FF-DDDDDDD----LL-LL-----BB-BB": 0x9,
					"----U--------R--R----FF-FF-DD-DDDDD----LLLLLL----BB-BB": 0xa,
					"----U--------RR-RR----F--F--D-DDDDDD---LL-LL----BBBBBB": 0xc
				}
			}, {
				'move': movesWithoutD,
				'head': "F2L-3",
				'step': {
					"----U-------RRRRRR---FFFFFFDDDDDD-DD----LL-LL---BB-BB-": 0x7,
					"----U-------RR-RR----FFFFFFDDDDDDDD----LLLLLL----BB-BB": 0xb,
					"----U-------RRRRRR----FF-FF-DDDDDDDD---LL-LL----BBBBBB": 0xd,
					"----U--------RR-RR---FF-FF-DD-DDDDDD---LLLLLL---BBBBBB": 0xe
				}
			}, {
				'move': movesWithoutD,
				'head': "F2L-4",
				'step': {
					"----U-------RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB": 0xf
				}
			}
		];

		var sabmeta = [
			{
				'move': moves,
				'maxl': 10,
				'fmov': ["x ", "x2", "x'"],
				'head': "Step 1",
				'step': {
					"---------------------F--F--D--D--D-----LLLLLL-----B--B": 0x0
				}
			}, {
				'move': movesRouxSB,
				'maxl': 16,
				'head': "Step 2",
				'step': {
					"------------RRRRRR---F-FF-FD-DD-DD-D---LLLLLL---B-BB-B": 0x1
				}
			}
		];

		var petrusmeta = [
			{
				'move': moves,
				'maxl': 8,
				'head': "2x2x2",
				'step': {
					"---------------------FF-FF-DD-DD--------LL-LL---------": 0x1,
					"------------------------------DD-DD----LL-LL-----BB-BB": 0x2
				}
			}, {
				'move': moves,
				'maxl': 10,
				'head': "2x2x3",
				'step': {
					"---------------------FF-FF-DD-DD-DD----LLLLLL----BB-BB": 0x3
				}
			}
		];

		var zzmeta = [
			{
				'move': moves,
				'maxl': 10,
				'head': "EOLine",
				'step': {
					"-H-HUH-H-----R-------HFH-F--D-HDH-D-----L-------HBH-B-": 0x0
				}
			}, {
				'move': movesZZF2L,
				'maxl': 16,
				'head': "ZZF2L1",
				'step': {
					"-H-HUH-H----RRRRRR---HFF-FF-DDHDD-DD----L-------BBHBB-": 0x1,
					"-H-HUH-H-----R-------FFHFF-DD-DDHDD----LLLLLL---HBB-BB": 0x2
				}
			}, {
				'move': movesZZF2L,
				'maxl': 16,
				'head': "ZZF2L2",
				'step': {
					"-H-HUH-H----RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB": 0x3
				}
			}
		];

		var eodrmeta = [
			{
				'move': moves,
				'maxl': 7,
				'head': "EO",
				'step': {
					"-H-HUH-H-----R-------HFH----H-HDH-H-----L-------HBH---": 0x0
				}
			}, {
				'move': moves,
				'maxl': 10,
				'head': "DR",
				'step': {
					"UUUUUUUUU---RRR------FFF---UUUUUUUUU---RRR------FFF---": 0x1
				}
			}
		];

