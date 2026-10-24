/* Learn: beginner guides, one per timer event.
   pic: '333' = draw the start state of each algorithm from the 3×3 simulator (verified in the build).
   src: 'checked' = every algorithm was machine-checked; 'guide' = steps follow a published beginner guide and could not be machine-checked. */
window.LEARN = [
{
  id: '3×3', name: '3×3', tag: 'Rubik’s Cube', level: 'Beginner', src: 'checked', pic: '333', ev: '3×3',
  intro: 'Solve it one layer at a time. Six steps, five short algorithms, and no memorising a hundred cases. Start with the white face and finish with yellow.',
  notation: [['R', 'Turn the right face a quarter turn clockwise, as if you were looking straight at it.'], ['L  U  D  F  B', 'Same idea for the left, up, down, front and back faces.'], ['R′', 'The apostrophe means the other way: counter-clockwise.'], ['R2', 'A 2 means a half turn, 180°.']],
  steps: [
    { t: 'White cross', d: 'Make a white plus on one face. Each white edge must also match the centre next to it: the white-green edge sits between the white and green centres, and so on. There is no algorithm for this. Move an edge to the top layer, turn the top until it lines up above its spot, then turn the face down.', algs: [] },
    { t: 'White corners', d: 'Turn the cube so white is at the bottom. Find a white corner in the top layer and turn the top until it sits above the gap where it belongs, front-right. Then repeat R U R′ U′ until it drops in.', algs: [{ w: 'Repeat until the corner drops in', m: "R U R' U'", n: 'Count the repeats by where the white sticker faces: it faces right, repeat once; it faces up, repeat three times; it faces front, repeat five times.' }], tip: 'A corner stuck in the bottom layer the wrong way round? Run R U R′ U′ once to bring it out, then place it again.' },
    { t: 'Middle layer', d: 'Look at the edges in the top layer that have no yellow. Turn the top until the front colour of an edge matches the front centre. Then look at its top colour: if it matches the right centre, use the first algorithm, if it matches the left centre, use the second.', algs: [{ w: 'Edge goes to the right', m: "U R U' R' U' F' U F" }, { w: 'Edge goes to the left', m: "U' L' U L U F U' F'" }], tip: 'An edge sitting in the middle layer but flipped or in the wrong slot: run either algorithm on it once to pop it out, then insert it again.' },
    { t: 'Yellow cross', d: 'Look at the yellow edges on the top face. You will see a dot, an L, or a straight line. Hold the cube so the shape sits as shown, then run the algorithm until you have a cross.', algs: [{ w: 'Make the yellow cross', m: "F R U R' U' F'", pic: 'll', n: 'A line: hold it left to right and run it once. An L: hold it with the two yellow edges at the back and left, and run it twice. A dot: run it once, turn the top so you have an L at the back and left, then run it twice more.' }] },
    { t: 'Match the yellow edges', d: 'Turn the top layer until as many yellow-cross edges as possible match their side centres. If two neighbouring edges match, hold the cube with them at the back and right and run the algorithm once. If none match, or only one, run it once from any side and look again, then repeat until all four match.', algs: [{ w: 'Swap the front and left edges', m: "R U R' U R U2 R' U", pic: 'll', n: 'It moves only top-layer edges, and leaves the first two layers alone.' }] },
    { t: 'Place the yellow corners', d: 'Turn the top until you find a corner that is already in the right place; its three colours match the three centres around it, in any order. Put it at the front-right and run the algorithm. It leaves that corner where it is and moves the other three round in a circle, so run it again if they are not right yet. No corner in place? Run it once from any side, then look again.', algs: [{ w: 'Move three corners in a circle', m: "U R U' L' U R' U' L", pic: 'll' }] },
    { t: 'Twist the yellow corners', d: 'Hold the cube with an unsolved corner at the front-right of the top. Repeat the pair of moves until that corner shows yellow on top; it takes two or four repeats. The cube will look scrambled in between, which is normal. Now turn only the top layer to bring the next unsolved corner to the front-right, and repeat. Do not turn the whole cube. After the last corner, turn the top layer to line it up, and you are done.', algs: [{ w: 'Twist one corner', m: "R' D' R D", n: 'Repeat it exactly two or four times, always finishing on the D.' }] }
  ],
  tips: ['Take your time. There is no rush, and every step keeps what the earlier steps built.', 'If you get lost in a step, you can repeat the algorithm for that step; it is built to be safe.', 'After the method clicks, learn to solve the cross in fewer moves, then look at F2L, OLL and PLL in the Train section.']
},
{
  id: '2×2', name: '2×2', tag: 'Pocket Cube', level: 'Beginner', src: 'checked', pic: '333', ev: '2×2',
  intro: 'A 2×2 is a 3×3 with no edges and no centres. You solve one layer, then fix the last layer. If you know the 3×3, you already know most of this.',
  notation: [['R  L  U  D  F  B', 'A quarter turn clockwise of that face, looking straight at it.'], ['′', 'Counter-clockwise.'], ['2', 'A half turn.']],
  steps: [
    { t: 'First layer', d: 'Build one face of a single colour, with the side colours of the four corners matching in pairs. Turn the cube so the layer is at the bottom. To bring a corner in, put it in the top layer above the gap where it belongs, then repeat R U R′ U′ until it drops in, just like the 3×3 white corners.', algs: [{ w: 'Drop a corner in', m: "R U R' U'", n: 'Repeat once, three times or five times, depending on where the bottom colour faces.' }] },
    { t: 'Place the last four corners', d: 'Turn the top layer and see how many corners are in the right place, not caring which way they face. Corners are right when the three colours match the three faces around them. If one is right, hold it at the front-right and use the circle algorithm. If two next to each other are swapped, use the swap. If two diagonal ones are swapped, use the diagonal swap.', algs: [{ w: 'One corner is right: move the other three', m: "U R U' L' U R' U' L", n: 'It leaves the corner at the front-right where it is.' }, { w: 'Two neighbours swapped', m: "L F' L' D' L' D F", n: 'Swaps the two corners at the front of the top layer.' }, { w: 'Two diagonal corners swapped', m: "F L F L' D' L' D", n: 'Swaps two corners that are opposite each other.' }] },
    { t: 'Twist the last corners', d: 'Hold an unsolved corner at the front-right of the top and repeat the moves until its top colour is right. Then turn only the top layer to bring the next one over. Finish by lining up the top layer.', algs: [{ w: 'Twist one corner', m: "R' D' R D", n: 'Repeat it two or four times, always ending on the D.' }] }
  ],
  tips: ['There are only 3.6 million positions, so every scramble can be solved in 11 moves or fewer.', 'When you are ready for speed, learn the CLL algorithms in Train. They solve the last layer in one move sequence.']
},
{
  id: '4×4', name: '4×4', tag: 'Rubik’s Revenge', level: 'Intermediate', src: 'partial', ev: '4×4',
  intro: 'A 4×4 has no fixed centres. The idea is called reduction: build the six centres, join the edges into pairs, and then it solves like a 3×3. Two extra cases, called parity, can show up at the end.',
  notation: [['R  L  U  D  F  B', 'Turn the outer layer of that face clockwise, as usual.'], ['Rw  Uw  …', 'A w means wide: turn the outer layer and the one next to it together.'], ['′  and  2', 'Counter-clockwise, and a half turn.']],
  steps: [
    { t: 'Centres', d: 'The four centre pieces of each face must all be one colour. Build white on one face, then yellow on the opposite face, then the four sides. Slide a block of centre pieces with wide turns, move them out of the way, and bring more in. There is no fixed recipe; take your time. Pick the colour scheme by looking at the corners once you are done: white opposite yellow, green opposite blue, red opposite orange.', algs: [] },
    { t: 'Pair the edges', d: 'Each edge has two halves. Find two halves of the same edge and bring them to the front-left and front-right, with other unpaired halves out of the way of the top layer so you do not break pairs you already made. Then use one of the two algorithms, which are mirror images. Keep the finished pairs on the top and bottom, not in the middle of the cube.', algs: [{ w: 'Pieces at front-left and front-right', m: "Uw L' U' L Uw'" }, { w: 'Mirror of the same', m: "Uw' R U R' Uw" }], tip: 'Make sure the two halves you join have the right colours relative to each other: look at where each colour sits on the edge before pairing.' },
    { t: 'Solve it like a 3×3', d: 'Use only the outer-layer turns (R, L, U, D, F, B) from here. Treat each pair of edges as a single edge, and each face’s four centres as one centre. Follow the 3×3 guide, from the white cross to the yellow corners.', algs: [], tip: 'Open the 3×3 guide from the list on the left whenever you need it.' },
    { t: 'Fix parity', d: 'Sometimes the 3×3 stage reaches a state that cannot happen on a normal 3×3. There are two cases. If one edge of the yellow cross is flipped, run the first algorithm. If two edges (or two corners at the end) are swapped, run the second. Afterwards finish the 3×3 stage again.', algs: [{ w: 'One edge flipped on the last layer', m: "Rw2 R2 B2 U2 Lw L' U2 Rw' R U2 Rw R' U2 F2 Rw R' F2 Lw' L B2 Rw2 R2", n: 'It flips that edge and leaves everything else as it was. Hold the flipped edge at the front, on top.' }, { w: 'Two last-layer edges swapped', m: "Rw2 R2 U2 Rw2 R2 Uw2 Rw2 R2 Uw2 U2", n: 'Swaps the edges at the front and back of the top layer, and leaves centres and corners alone. Hold the swapped pair there first.' }] }
  ],
  tips: ['Parity is not a mistake. Even experts hit it about half the time.', 'Take your time with the centres. Nothing else will fix a centre pair that is wrong.']
},
{
  id: '5×5', name: '5×5', tag: 'Professor’s Cube', level: 'Intermediate', src: 'partial', ev: '5×5',
  intro: 'The same reduction idea as the 4×4, only with a fixed centre piece on every face, so no colour-scheme guessing and no swap parity. You build centres, join three-piece edges, then solve a 3×3.',
  notation: [['R  L  U  D  F  B', 'Outer layer, clockwise.'], ['Rw  Uw  …', 'Wide: the outer two layers together.'], ['′  and  2', 'Counter-clockwise, half turn.']],
  steps: [
    { t: 'Centres', d: 'Every face has a fixed middle piece, and it tells you the colour of that face. Build the white and the yellow centres first, then the four sides, using wide turns to slide whole rows of 3 centre pieces.', algs: [] },
    { t: 'Edges', d: 'Each edge is three pieces: a middle one that is fixed and two wings. First join the wings on the edges to the middle piece, with the same method as on the 4×4: find them, bring them to the front-left and front-right, then use a slice trick. Do it for 8 edges, flip the cube over, and do the other 4. For the last few edges the wings will already be in awkward spots, so use a wide turn to move a pair out of the way.', algs: [{ w: 'Pieces at front-left and front-right', m: "Uw L' U' L Uw'" }, { w: 'Mirror of the same', m: "Uw' R U R' Uw" }] },
    { t: 'Last two edges', d: 'When only two edges are left, there is nothing free to pair them with. Hold the cube so the two unfinished edges are on the right side, one above the other, then run the algorithm. It joins the halves of both edges at once, swapping pieces between the upper and lower edge, and leaves every finished edge, centre and corner as it was. If the picture below does not match what you see, use the mirror version.', algs: [{ w: 'Last two edges, right side', m: "Rw' U' R' U R' F R F' Rw", n: 'Checked on a model of a 5×5: it solves the first case in the Train section\'s Last two edges set.' }, { w: 'Mirror version, left side', m: "Lw U' R' U R' F R F' Lw'", n: 'The second case in that set.' }], tip: 'More cases, with a picture for each, are in Train under 5×5 · Centres and edges.' },
    { t: 'Solve it like a 3×3', d: 'Use only the outer-layer turns, and treat each triple of edge pieces as one edge and each 3×3 block of centres as one centre.', algs: [] },
    { t: 'Fix edge parity', d: 'On a 5×5 the only parity is an edge that ended up flipped on the last layer (or sometimes while pairing the final edges). Hold it at the front, on top, and run this. It flips just that edge.', algs: [{ w: 'Flip one edge', m: "Rw2 R2 B2 U2 Lw L' U2 Rw' R U2 Rw R' U2 F2 Rw R' F2 Lw' L B2 Rw2 R2" }], tip: 'The two-edges-swapped case from the 4×4 does not happen on a 5×5.' }
  ],
  tips: ['Do not rush the centres. A wrong centre piece can only be fixed by undoing work.', 'After you can solve one, the 6×6 and 7×7 follow the same plan.']
},
{
  id: '6×6', name: '6×6', tag: 'V-Cube 6', level: 'Advanced', src: 'partial', ev: '6×6',
  intro: 'A 6×6 combines the two ideas: like the 4×4 it has no fixed centres, and like the 5×5 its edges have more than one pair of pieces. Same reduction plan, with more of everything.',
  notation: [['R  L  U  D  F  B', 'Outer layer, clockwise.'], ['Rw  3Rw', 'Wide turns: Rw moves the outer two layers, 3Rw moves the outer three.'], ['′  and  2', 'Counter-clockwise, half turn.']],
  steps: [
    { t: 'Centres', d: 'Each face has four 2×2 blocks that need to be one colour. Build white and yellow on opposite faces, then the four sides. Check the colour scheme from the corners: white opposite yellow, green opposite blue, red opposite orange.', algs: [] },
    { t: 'Edges', d: 'Each edge has four pieces: two pairs of wings. First pair up the two middle wings of each edge, then pair up the pair with the outer wings, using the same slice trick as on the 4×4 with wide turns of two layers and three layers.', algs: [{ w: 'Pieces at front-left and front-right', m: "Uw L' U' L Uw'" }, { w: 'Mirror of the same', m: "Uw' R U R' Uw" }] },
    { t: 'Solve it like a 3×3', d: 'Use only outer-layer turns. Each group of edges is one edge, each face’s centres are one centre.', algs: [] },
    { t: 'Fix parity', d: 'A 6×6 can end the 3×3 stage with one flipped edge. Hold it at the front, on top, and run this.', algs: [{ w: 'Flip one edge', m: "Rw2 R2 B2 U2 Lw L' U2 Rw' R U2 Rw R' U2 F2 Rw R' F2 Lw' L B2 Rw2 R2" }], tip: 'It can also show up with two edges swapped. That fix for the 6×6 is not in this guide yet, so look it up if you meet it.' }
  ],
  tips: ['It takes patience: a first solve can take over an hour.', 'The centres decide how clean the rest feels, so spend your time there.']
},
{
  id: '7×7', name: '7×7', tag: 'V-Cube 7', level: 'Advanced', src: 'partial', ev: '7×7',
  intro: 'The biggest cube in the list. It works exactly like the 5×5, just bigger: fixed centre pieces, three-piece rows to build, and edges with two pairs of wings.',
  notation: [['R  L  U  D  F  B', 'Outer layer, clockwise.'], ['Rw  3Rw', 'Wide turns: Rw moves the outer two layers, 3Rw the outer three.'], ['′  and  2', 'Counter-clockwise, half turn.']],
  steps: [
    { t: 'Centres', d: 'Every face has a fixed middle piece that tells you its colour. Build white and yellow first, then the four sides, working in rows of 5 across the face.', algs: [] },
    { t: 'Edges', d: 'Each edge has five pieces. Join the wings pair by pair to the fixed middle one with the same slice move as on the 4×4 and 5×5.', algs: [{ w: 'Pieces at front-left and front-right', m: "Uw L' U' L Uw'" }, { w: 'Mirror of the same', m: "Uw' R U R' Uw" }] },
    { t: 'Solve it like a 3×3', d: 'Only outer-layer turns from here.', algs: [] },
    { t: 'Fix parity', d: 'Like the 5×5, a 7×7 can finish the 3×3 stage with a single flipped edge. Hold it at the front, on top, and run this.', algs: [{ w: 'Flip one edge', m: "Rw2 R2 B2 U2 Lw L' U2 Rw' R U2 Rw R' U2 F2 Rw R' F2 Lw' L B2 Rw2 R2" }] }
  ],
  tips: ['Plan on a long session. Put the cube down at any step and come back.']
},
{
  id: 'Clock', name: 'Clock', tag: 'Rubik’s Clock', level: 'Beginner', src: 'guide', ev: 'Clock',
  intro: 'Two sides, each with nine clocks. You solve it by getting every clock to 12 at once. There are no algorithms, just pins and wheels.',
  notation: [['Pins', 'Four pins. Each pin is pushed in or popped out, and its state is opposite on the back. A raised pin links the four clocks around it to the nearest wheel.'], ['Wheels', 'Turning a wheel next to a raised pin turns all the clocks linked to that pin.'], ['12', 'Solved means every clock on both sides points to 12, shown by the red notch.']],
  steps: [
    { t: 'Cross on the first side', d: 'Put all pins up and the first side facing you, with 12 at the top. Pick an edge clock (not a corner and not the middle). If its hand already matches the middle clock, pick another. Otherwise push down the two pins closest to it, then turn one of the wheels opposite it until the middle hand points where your chosen clock points. Do the same for the other three edge clocks.', algs: [] },
    { t: 'Cross on the other side', d: 'Put all pins up so the first cross stays solved. Flip the puzzle and repeat the same process for the four edge clocks on this side. When all four match the centre, put the pins up and turn any wheel until the cross points to 12.', algs: [] },
    { t: 'Corners', d: 'Put all pins up and make sure all the non-corner clocks show 12. Choose a corner clock that is not on 12, and push down the pin nearest to it. Turn the opposite wheel, or any wheel except the one at the lowered pin, until the corner matches the edges and centre. Do the same for each corner. Put the pins up and turn any wheel until everything reads 12, then check the other side.', algs: [] }
  ],
  tips: ['If you change a clock you finished, put the pins up and check before moving on.', 'This is solved by thinking, not by memorising. Go slowly with the pins.']
},
{
  id: 'Mega', name: 'Megaminx', tag: 'Twelve-sided', level: 'Intermediate', src: 'guide', ev: 'Mega',
  intro: 'A Megaminx is a 3×3 with twelve faces. It works the same way, layer by layer, so if you know the 3×3 method, you can solve it. Each step uses the same ideas.',
  notation: [['R  L  U  D  F', 'A clockwise turn of that face. Add ′ for counter-clockwise.'], ['3', 'A number after a letter means repeat that turn.'], ['Note', 'The scrambles use R++ and D−− for the double-layer turns, which is a different notation from this guide.']],
  steps: [
    { t: 'White star and corners', d: 'Make a white star on one face with the edges matching their side centres, as in the 3×3 white cross. Then bring in the white corners one by one, just as on the 3×3.', algs: [] },
    { t: 'Second layer', d: 'Turn the white face to the bottom. Find the edges for the next row and put each in with the 3×3 middle-layer algorithms, then turn the corner above each finished edge into place.', algs: [] },
    { t: 'Third layer', d: 'Insert the edges of the next row, then solve the corners the same way as the white corners.', algs: [{ w: 'Edge to the left', m: "F' R' F'2 R F" }, { w: 'Edge to the right', m: "F L F2 L' F'" }] },
    { t: 'Repeat to the bottom half', d: 'Do another round of corners and middle edges until the top half is done, using what you already know.', algs: [] },
    { t: 'Top star', d: 'Make a star on the last face with the 3×3 yellow-cross algorithms.', algs: [{ w: 'Flip the front and right edges', m: "F U R U' R' F'" }, { w: 'Flip the front and back edges', m: "F R U R' U' F'" }] },
    { t: 'Cycle the edges', d: 'Match the last-layer edges with their centres. This is the 3×3 yellow-edge swap, with one extra turn.', algs: [{ w: 'Clockwise', m: "R U R' U R U3 R' U" }, { w: 'Counter-clockwise', m: "U' R U2 R' U' R U' R'" }] },
    { t: 'Position and twist the corners', d: 'Place the last-layer corners, then twist them one by one: bring an unsolved corner to the highlighted spot and repeat R′ D′ R D until it is right, then turn U for the next.', algs: [{ w: 'Corners clockwise', m: "L' U2 R U'2 L U2 R' U'2" }, { w: 'Corners counter-clockwise', m: "R U'2 L' U2 R' U'2 L U2" }, { w: 'Twist a corner', m: "R' D' R D" }] }
  ],
  tips: ['It is the 3×3 method with more repeats. Work the same way, one layer at a time.', 'The cube looks scrambled mid-way through twisting the corners. It resolves once all of them are done.']
},
{
  id: 'Pyra', name: 'Pyraminx', tag: 'Triangle', level: 'Beginner', src: 'guide', ev: 'Pyra',
  intro: 'A pyramid with four faces. There are only tips, centres and edges to solve, and you can finish in under 12 moves from any position.',
  notation: [['U  L  R  B', 'These name the four corners of the puzzle. A letter on its own is a clockwise turn of that corner, a third of a rotation.'], ['′', 'Counter-clockwise.']],
  steps: [
    { t: 'Tips and centres', d: 'Turn each of the four tips so it matches its centres, then turn the layers underneath to make the three centre colours agree on every face. Do this by eye, with no algorithm.', algs: [] },
    { t: 'Three edges around one corner', d: 'Solve the edges around the top corner. You can usually place the first two by eye. The third needs an algorithm. Use the right one or the left one, depending on the direction the edge is being inserted.', algs: [{ w: 'Insert from the right', m: "R F R' F'" }, { w: 'Insert from the left', m: "L' F' L F" }] },
    { t: 'Last layer edges', d: 'Hold the puzzle with the unsolved face on the left. Pick the algorithm that matches what you see: three edges in a circle clockwise or counter-clockwise, or two edges flipped.', algs: [{ w: 'Cycle three edges clockwise', m: "U' F U F'" }, { w: 'Cycle three edges counter-clockwise', m: "U L' U' L" }, { w: 'Flip two edges', m: "F U' F' U F' L F L'" }] }
  ],
  tips: ['The notation names corners, so it is worth turning the puzzle in your hands to find the right letter.', 'The tips can be turned at any time without breaking the rest.']
},
{
  id: 'Skewb', name: 'Skewb', tag: 'Corner-turning cube', level: 'Beginner', src: 'guide', ev: 'Skewb',
  intro: 'A cube that turns around its corners. There are only eight corners and six centres, and every turn moves both at once.',
  notation: [['F  R  L  B', 'These name corners of the puzzle, not faces. A letter on its own is a clockwise turn of a third of a rotation.'], ['′', 'Counter-clockwise.'], ['Heads up', 'The Timer’s scrambles name the four corners U, R, L, B. This guide’s F is probably the Timer’s U, but that has not been confirmed. Learn the turns by feel, and check the first move on your puzzle.']],
  steps: [
    { t: 'Solve the first face', d: 'Bring the four matching corners around one centre. Try it by eye first, as on the 3×3 corners. If three corners are right and the last one is twisted the wrong way, use one of these, which keep the others in place.', algs: [{ w: 'Twist clockwise', m: "F R F' R'" }, { w: 'Twist counter-clockwise', m: "F' L' F L" }] },
    { t: 'Cycle the centres', d: 'Put the other five centres in place by moving three of them round a bottom corner. Hold the puzzle with the solved face on top and repeat as needed.', algs: [{ w: 'Around the front corner, clockwise', m: "L B L' B' R' B' R B" }, { w: 'Around the front corner, counter-clockwise', m: "R' B' R B L B L' B'" }] },
    { t: 'Fix the last four corners', d: 'Hold the solved side up. If two bottom corners both show the bottom centre’s colour on the same side (a pair of headlights), put that side at the front-right and run this. If there is none, run it until a pair appears.', algs: [{ w: 'Twist the bottom corners', m: "L' F L F' L' F L F'" }] }
  ],
  tips: ['A centre swap by itself is impossible: every turn cycles centres in threes.', 'Learn to see the corner letters on your puzzle; the rest follows.']
},
{
  id: 'Sq-1', name: 'Square-1', tag: 'Shape-shifting', level: 'Intermediate', src: 'guide', ev: 'Sq-1',
  intro: 'A puzzle that changes shape. First you make it a cube, then you solve the corners and the edges as on a normal cube. Parity can appear at the end.',
  notation: [['/', 'A slice: a half turn of the right half, like a 180° R turn.'], ['(a, b)', 'Turn the top layer a steps and the bottom b steps, then slice. One step is 30°, so an edge is 1 step and a corner is 2. Positive is clockwise.'], ['Hold', 'Red faces you, green is on the right, yellow is on top, white on the bottom.']],
  steps: [
    { t: 'Make a cube shape', d: 'Get the puzzle into a cube. No pieces are solved yet, so you cannot break anything. Do it by eye: group the small pieces together and slice. If the middle layer is not square, use this.', algs: [{ w: 'Fix a middle layer that is not square', m: "(0, -1) / (6, 0) / (6, 0) / (0, 1)" }] },
    { t: 'Yellow corners', d: 'First get every corner into its correct layer, by eye. To swap a top and a bottom corner, use the first algorithm. Then place the yellow corners with the second, which swaps two pieces on the top right.', algs: [{ w: 'Swap a top and a bottom corner', m: "(0, -4) / (0, 3) / (0, 1)" }, { w: 'Place the yellow corners', m: "(1, 0) / (0, -3) / (0, 3) / (0, -3) / (0, -3) / (0, 6) / (-1, 0)" }] },
    { t: 'Edges to their layers', d: 'Yellow edges go on top, white edges on the bottom. Put the two edges to swap at the top right and bottom right, run this, and repeat until every edge is on the right layer.', algs: [{ w: 'Swap an edge between layers', m: "(1, 0) / (0, -3) / (0, -3) / (-1, -1) / (1, 4) / (0, 3) / (-1, 0)" }] },
    { t: 'Swap the bottom corners', d: 'Fix the white corners with this, which swaps the two front-facing bottom corners.', algs: [{ w: 'Swap two bottom corners', m: "/ (3, -3) / (0, 3) / (-3, 0) / (3, 0) / (-3, 0) /" }] },
    { t: 'Place the edges', d: 'Move the edges to their final spots. This swaps the top-right and top-back edges, and the bottom-right and bottom-back edges, at once. The puzzle is usually solved now.', algs: [{ w: 'Swap two pairs of edges', m: "(0, 2) / (0, -3) / (1, 1) / (-1, 2) / (0, -2)" }] },
    { t: 'Parity', d: 'If only two edges are left to fix, you have parity. Run this to swap two top edges, then go back to the step before.', algs: [{ w: 'Fix parity', m: "/ (3,3) / (1,0) / (-2,-2) / (2,0) / (2,2) / (-1,0) / (-3,-3) / (-2,0) / (3,3) / (3,0) / (-1,-1) / (-3,0) / (1,1) / (-4,-3)" }] }
  ],
  tips: ['Parity looks like a mistake but it is a normal part of the puzzle.', 'The Train section has Square-1 cases you can drill, once the basic steps feel familiar.']
},
{
  id: '3BLD', name: '3BLD', tag: '3×3 blindfolded', level: 'Advanced', src: 'overview', ev: '3BLD',
  intro: 'Blindfolded solving: look at a scrambled cube, memorise it, then solve it without looking. It is a different skill from speed solving, built on memory and a fixed system.',
  notation: [['Idea', 'Every piece gets a letter. You memorise two lists, one for edges and one for corners, then fix the cube by swapping pieces into place one at a time.']],
  steps: [
    { t: 'The plan', d: 'Look at the cube for as long as you need. Work out where each piece has to go, turn that into a chain of letters (a list for edges, a list for corners), and memorise the chains with a story or a path through places you know. Then put on the blindfold and carry out the chain.', algs: [] },
    { t: 'The tools', d: 'Each swap uses a short algorithm that moves a few pieces and leaves the rest alone. Two common ones swap an edge pair and a corner pair together. T-perm swaps the left and right top edges and two top corners on the right. Y-perm swaps a diagonal corner pair and two top edges.', algs: [{ w: 'T-perm', m: "R U R' U' R' F R2 U' R' U' R U R' F'", n: 'Swaps the top-left and top-right edges and the top back-right and front-right corners.' }, { w: 'Y-perm', m: "F R U' R' U' R U R' F' R U R' U' R' F R F'", n: 'Swaps the back-left and front-right corners and the top left and back edges.' }] },
    { t: 'Practise in pieces', d: 'Learn the edges first, then the corners, then put them together. Use 3BLD scrambles with the timer, and review each attempt to see where the memory failed.', algs: [] }
  ],
  tips: ['This guide is an overview. A full blindfold method has many more parts.', 'Start by solving just the edges, with the blindfold off for the corners.']
},
{
  id: 'FMC', name: 'FMC', tag: 'Fewest Moves', level: 'Advanced', src: 'overview', ev: 'FMC',
  intro: 'Fewest Moves Challenge: you get an hour, no timer on the cube, and you write the shortest solution you can find. It is a thinking competition, not a speed one.',
  notation: [['Rules', 'You work on paper, with a cube only for checking. The score is the number of moves. A shorter solution wins.']],
  steps: [
    { t: 'Choose a start', d: 'Use the cube to explore. Look for a small block of pieces that can be solved in a few moves, like a 2×2×2 or 2×2×3, and then extend it.', algs: [] },
    { t: 'Look at edge orientation', d: 'A very short solution often starts by making the cube easy: get all edges oriented first, using only the moves that keep a certain structure, and then finish with a set of moves that leave the orientation alone.', algs: [] },
    { t: 'Look for shortcuts', d: 'When you have a solution, check each part for a shorter way, and look for a short sequence that fixes the last few pieces.', algs: [] }
  ],
  tips: ['Write every move down. You can only write what you can check.', 'The scramble comes from the Timer’s FMC tab, with the same moves as in the competition.']
},
{
  id: 'OH', name: 'One-handed', tag: '3×3 with one hand', level: 'Intermediate', src: 'overview', ev: 'OH',
  intro: 'One-handed is the 3×3 solved with one hand only. Use the same method, with turns that your hand can do: rotate the cube more, and prefer R, U, and F turns.',
  notation: [['Idea', 'Turns on the right and top are easy for one hand. Moves that need two hands, like M or a back-face turn, are replaced with nearby ones.']],
  steps: [
    { t: 'Learn the 3×3 first', d: 'Follow the 3×3 guide until you can solve the cube comfortably. The steps and algorithms are the same.', algs: [] },
    { t: 'Hold the cube well', d: 'Rest the cube on the palm of your off hand, or on the table, and turn it with your thumb, index and middle finger. Turn the whole cube rather than stretching to reach a face.', algs: [] },
    { t: 'Use hand-friendly algorithms', d: 'Many algorithms have versions made of R, U, F and D that suit a single hand. The Train section shows the algorithm sets, including OLL for one hand.', algs: [] }
  ],
  tips: ['Speed comes later; first get a smooth, comfortable hold.', 'Practise with the OH scramble in the Timer.']
}
];
