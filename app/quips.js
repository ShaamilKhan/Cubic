/* Post-solve comments. Pure logic: given the solve and the history before it, say something fitting.
   make({ name, ev, ms, pen, prev, total, recent, lastText }) -> { text, tone, kind, fx }
   prev  = values (ms, Infinity for DNF) of the earlier solves in the same session, oldest first
   pen   = '0' | '2' | 'DNF'
   Lines may carry placeholders. A line is only eligible when every placeholder it uses can be filled with a true number:
     {name} {puzzle} {time} {n} {best} {thr}   plain facts
     {diff}  seconds away from your recent median (the direction is in the sentence, and the category guarantees it)
     {gap}   seconds slower than your best        {by}  seconds faster than your best                              */
(function (g) {
  'use strict';

  const POOL = {
    first: [
      'First solve in the books, {name}. Welcome.',
      'One down. Timer works, cube works, you work.',
      'And so it begins. The first of many.',
      'First solve logged. Everything from here is a personal best, technically.',
      '{time} on the board. That’s the number to beat.',
      'First {puzzle} solve is in. The graph starts here.',
      'Day one stats: {time}. It can only get… different.',
      'Solve #1 done. Your cube has never been so proud.'
    ],
    early: [
      'Warming up. Keep going.',
      'Nice. Let’s see how this session goes.',
      'Still finding the rhythm. It comes.',
      'The cube is awake. So are your fingers.',
      'Solve {n} done. The averages need a few more to wake up.',
      'Give it a few more and the stats start to mean something.',
      'Early days, {name}. Settle into it.',
      'Loosen the shoulders. Relax the grip. Go again.',
      'Warm-up solves don’t count. (They do. But still.)',
      'Cubes need a minute to warm up too.'
    ],
    earlybest: [
      'Fastest so far. Early days, but it counts.',
      'Quickest of the session. Keep it rolling.',
      'That’s the one to beat. No pressure.',
      '{time}: fastest yet, {by}s quicker than your old best.',
      'New best of the bunch by {by}s. Nice start.',
      'A quicker one already. The cube is warming to you, {name}.',
      'Best so far. The bar is low, but you cleared it.',
      'Look at that, {by}s off your best. Smooth.',
      'Fastest yet. Fingers are loosening up.',
      'Early best. Let’s see if you can bank it.'
    ],
    pb: [
      'New personal best. The cube never saw it coming.',
      'PB! Somewhere, a stackmat just blushed. Nice one, {name}.',
      'That’s a personal best, {name}. Screenshot it. Nobody will believe you.',
      'New best. Your future self says thanks.',
      'PB. The lube is working and so are you.',
      'Fresh PB. The cube is in shambles.',
      'Personal best. Lookahead was on and it shows.',
      '{time}. That’s {by}s under your old best.',
      'New PB by {by}s. Frame it.',
      '{by}s faster than you have ever been. Let that sink in.',
      'Personal best: {time}. The old record has been retired with honours.',
      'PB on {puzzle}. The scoreboard approves.',
      'You just beat your own best, and it wasn’t even close to a lock-up.',
      'New best of {time}. Quick, tell someone who cares about cubes.',
      'That’s a PB. Go ahead and do the little fist pump.',
      'PB! Even your inspection looked fast.',
      'A new best, {name}. The cross was probably planned in one glance.',
      '{time}. Your old best is crying in the corner.',
      'Best ever. The stickers are still warm.',
      'New PB, by {by}s. Small margins, big feelings.',
      'You’ve gone faster than you ever have. Again, but quieter.',
      'PB energy. The cube didn’t stand a chance.',
      'That was a clean one. New best, {name}.',
      'Record broken. The record was you, so it’s fine.'
    ],
    sub: [
      'First sub-{thr}. Frame this one.',
      'Sub-{thr}! Welcome to the club, {name}. Jackets are optional.',
      'You just went sub-{thr}. That’s a new tier.',
      'Sub-{thr}, finally. Tell the group chat, {name}.',
      '{time}: your first sub-{thr}. A milestone, not just a number.',
      'Sub-{thr} unlocked. Achievement earned: tired thumbs.',
      'You broke {thr} seconds. Mark this day.',
      'First sub-{thr} on {puzzle}. The next target is already in your head.',
      '{time}. Sub-{thr} is no longer a someday thing.',
      'Sub-{thr}! Your younger self wouldn’t believe it.',
      'That’s a sub-{thr} and a PB in one. Efficient.',
      'Under {thr} seconds for the first time. Hold onto that feeling.',
      'Sub-{thr}. Now do it again and it’s a habit.',
      'Barrier broken: sub-{thr}. Go celebrate with fresh lube.'
    ],
    great: [
      'That one flew, {name}. Fingers were on fire.',
      'Way faster than your usual. Did you warm up?',
      'Smooth. Not a single regrip.',
      'Clean cross, clean solve.',
      'That’s the kind of solve you mention to people.',
      'Lookahead on point. Beautiful.',
      '{diff}s faster than your median. That’s not luck, that’s lookahead.',
      '{time}, {diff}s under your usual. Do it again, I dare you.',
      '{diff}s quicker than your recent middle. Hands were flying.',
      'Great solve. Only {gap}s from your best.',
      'That was {diff}s of pure efficiency.',
      'Nearly a PB. {gap}s away.',
      'Fast one. The scramble must have been kind… or you were just good.',
      'You just made the median look slow.',
      'Fluid. The cube barely had time to scramble back.',
      'Fast, clean, and a little smug. Deservedly.',
      'That’s the sound of a good cross turning into a better F2L.',
      'Your hands knew that one before you did.',
      '{diff}s faster than normal. Whatever you ate, keep eating it.',
      'Straight-up quick. The graph is going to love that.',
      'Pace like that and the PB is coming for you.',
      'Beautiful turning, {name}.'
    ],
    good: [
      'Solid. Faster than your recent average.',
      'Good one, {name}.',
      'Nice turning. The cube approves.',
      'Quicker than usual. Keep that rhythm.',
      'Smooth. Do that again.',
      '{diff}s under your median. Quietly good.',
      'A little faster than usual. Those add up.',
      '{time}. That’s {diff}s better than your middle solve.',
      'Good solve. {gap}s from your best.',
      'Under your median. The trend is kind today.',
      'Tidy. No hesitation anywhere.',
      'You’re in the groove, {name}.',
      'Not a PB, but a very respectable day at the office.',
      'Faster than your recent median by {diff}s. Keep it simple.',
      'Consistent and quick. Dangerous combination.',
      'That one had flow.',
      'Nice. Chasing the PB one clean solve at a time.',
      'The cube is cooperating. Take advantage.'
    ],
    ok: [
      'Right on your average. Consistency is a skill.',
      'Steady, {name}. Boring is fast.',
      'A very you solve.',
      'Par for the course.',
      'Exactly what you do. Respect.',
      'Within {diff}s of your median. Metronome mode.',
      '{time}. Almost identical to your usual.',
      'Dead average. The graph shrugs.',
      'No drama. Just a solve.',
      'Reliable. Your median should be proud.',
      'Average is just a PB in disguise. Keep going.',
      'That’s the cube’s way of saying “same again”.',
      'Consistent as ever. {gap}s from your best.',
      'A solid ordinary one. Ordinary is underrated.',
      'Not fast, not slow, just you.',
      'The numbers say “typical”. The cube says “fine”.',
      '{time} on {puzzle}. Typical of you, and I mean that kindly.',
      'Textbook middle solve.'
    ],
    meh: [
      'Slightly slow. Probably the lube’s fault.',
      'The cross took a scenic route there.',
      'Not your best, but the cube is still in one piece.',
      'Blame the scramble, {name}. Everyone does.',
      'A little off the pace. Shake it out.',
      '{diff}s slower than your median. Not a crisis.',
      'A touch slower than usual. Roll the shoulders and go.',
      '{time}. A bit above your middle solve, nothing to worry about.',
      'Off by {diff}s from usual. One more and you’re back.',
      'That one hesitated somewhere in F2L. We saw it.',
      'Mildly slow. Mildly fine.',
      'The pace dipped. The next one is a fresh start.',
      'Probably a regrip or two in there.',
      'Not terrible. The cube just had opinions.',
      '{gap}s off your best. It happens to everyone.',
      'Your fingers will catch up with your brain.',
      'Slow-ish. The cube was in a mood.',
      'Take a breath. Look at the cross before you start.'
    ],
    slow: [
      'That one dragged. Shake it off.',
      'Did you stop to admire the F2L? It happens.',
      'Lost the white edge for a second there? Classic.',
      'Slow solve, fast recovery. Next one, {name}.',
      'The cube won that round. Go again.',
      '{diff}s slower than usual. Consider it a lesson.',
      '{time}. That’s a long one. Reset and breathe.',
      'Slow solves are just PBs gathering strength.',
      'Probably a mistimed look-ahead. Or a cat walked by.',
      'That one fought back. Let it go.',
      'That was {diff}s above your median. The next one won’t be.',
      'The cube disagreed with your plan. Make a new plan.',
      'We all have those. Quick, do another before you think about it.',
      'Your fingers took a coffee break.',
      'Rough one. Your streak is not defined by it.',
      'Slow, but you finished. That’s the whole sport.',
      'Long solve. The cube is possibly haunted.',
      'Think of it as extra time with the cube. Free practice.'
    ],
    worst: [
      'Your slowest yet. Even the cube felt that one.',
      'Worst solve on record. It can only go up from here.',
      'That’s your slowest. We’ll pretend it was a lock-up.',
      'A new low. Stretch, hydrate, go again.',
      'Slowest ever. Statistically, the next one is better.',
      '{time} is now your slowest of {n} solves. Never again.',
      'Slowest of {n} solves. Delete it from memory.',
      'Your worst on {puzzle}. The only way is down (in time).',
      'That’s the longest one yet. Time for a break, then a comeback.',
      'Slowest solve to date, {name}. Everyone has one. This is yours.',
      'The record for slowest got broken. Not the one you wanted.',
      'That was a character-building solve.',
      'Worst so far. Take it as the floor and build up.',
      'Even the best cubers have one of these. Now go again.',
      'You found a new bottom. Good news: solid ground.',
      'Slowest yet. Rest your hands and try again.'
    ],
    dnf: [
      'DNF. The cube had other plans.',
      'Pop, lock-up, or “I swear that was solved”?',
      'Almost solved is still a DNF. The cube is cruel.',
      'DNF. Sometimes the cube wins, {name}. Reset and go.',
      'That one goes in the “we don’t talk about it” folder.',
      'You stopped at {time}, but the cube wasn’t finished. Rude.',
      'DNF. Check for a sneaky U-face twist next time.',
      'So close. One piece, one twist, one DNF.',
      'It’s not a DNF, it’s a “data point”.',
      'Cube said no. Cube is allowed.',
      'DNF at {time}. The next solve doesn’t care.',
      'DNF. Blame the scramble. Everybody does.',
      'The cube says: not today. You say: again.',
      'A DNF is just a solve you’ll tell a funny story about.',
      'Missed it by a layer. Or a corner. Or a mood.',
      'DNF. Shake it off, {name}. You were this close.',
      'One twist from glory. DNF.',
      'DNF. Check your cube’s tension. Or your faith.',
      'The cube is not actually solved. Cubes cannot lie.',
      'Pop? Lock-up? Plot twist? All valid.',
      'Stop the timer only after the last turn. We’ve all been there.',
      'DNF noted. Honesty is the best algorithm.',
      'It happens to world champions too. Mostly.',
      'Let that one go. Solve {n} is waiting.'
    ],
    plus2: [
      '+2. A tiny turn short of glory.',
      '+2, the cube’s little tax.',
      'One layer slightly off. That’ll cost two seconds.',
      '+2. Always check the U face before you stop the timer, {name}.',
      'So close. +2 and move on.',
      '+2 puts you at {time}. Not the end of the world.',
      'That’s a +2. The AUF fairy visited.',
      'Counts as {time}. Check the last layer next time.',
      'A quarter turn short. +2 and a lesson.',
      '+2. The final U turn is not optional.',
      'The cube asked for two seconds. You paid.',
      '+2: it’s still a solve. Barely.',
      'Aligned almost perfectly. +2 anyway.',
      '+2. Small penalty, big learning moment.',
      'Missed the AUF. It’s always the AUF.',
      '{time} with the penalty. Your hands will remember.',
      'Almost there, +2.',
      'That last turn lied to you. +2.',
      'Crisp solve, tiny mistake. +2.',
      '+2 on {puzzle}. The cube is picky about alignment.'
    ],
    // faster than anyone has ever solved the puzzle: the timer, not the cuber, is the likely culprit
    impossible: [
      '{time} on {puzzle}? The world record is about {wr}s. The timer almost certainly stopped early.',
      'That’s well under the {puzzle} world record of about {wr}s. Accidental tap?',
      '{time} is faster than any human has solved {puzzle}. Check for an early stop, {name}.',
      'The record for {puzzle} is around {wr}s, so {time} is not a solve. Delete it and go again.',
      'Impossible on {puzzle}: the world record is about {wr}s and that was {time}. Did a key get pressed?',
      'Nice try. The timer stopped at {time} and the {puzzle} record is about {wr}s.',
      'Not even the record holder does {puzzle} in {time}. Stray keypress?',
      'World record for {puzzle}: about {wr}s. Your timer: {time}. One of them is wrong.',
      'Time travel detected: {time} on {puzzle}. The record is about {wr}s.',
      'That solve took less time than the record by a lot. It was probably a mis-stop, {name}.'
    ],
    // under the record by a little: still not believable, but closer to plausible
    nearwr: [
      '{time} would beat the {puzzle} world record of about {wr}s. If that’s real, call the WCA.',
      'Under the {puzzle} world record ({wr}s)? Double-check the timer stopped when you finished.',
      '{time}: a world-record pace on {puzzle}. Let’s call it a lucky scramble and a quick tap.',
      'That’s faster than the {puzzle} record of about {wr}s. Possible, but check the timer.',
      'Record territory: {time} against about {wr}s. Verify it with a second solve.',
      'If {time} is real, you just beat the {puzzle} world record. A video would help.',
      'A solve like {time} would rewrite the {puzzle} record books. Did the timer start late?',
      'World-record fast, {name}. Or the timer stopped early. Probably the second one.'
    ],
    // within reach of the record: respect, with a healthy dose of doubt
    elite: [
      '{time} on {puzzle} is world-record territory (about {wr}s). That is serious speed.',
      'Within touching distance of the {puzzle} record of about {wr}s. Wow.',
      '{time}. That’s the kind of time people clip and post. Nicely done, {name}.',
      'Elite pace: {time} when the world record is about {wr}s. Lucky scramble, or just very good?',
      'Only a handful of people in the world solve {puzzle} like that. Check it’s real, then celebrate.',
      '{time} on {puzzle}, close to the world record. Your cube is probably very well lubed.',
      'That’s a world-class time. The record is about {wr}s.',
      'Straight into the all-time rankings neighbourhood. {time}, {name}.'
    ],
    // far quicker than your own history, but not near a record: most likely a stray press
    tooquick: [
      'Less than half your usual {puzzle} time. Accidental stop?',
      '{time} is way under your usual. Did a key slip?',
      'Whoa, that’s less than half your usual. Might have been a mis-stop, {name}.',
      'A huge jump from your normal pace. Check the timer didn’t stop early.',
      '{time}? That’s under half your median. Suspicious.',
      'Your median is {med}s. This was {time}. Stray tap?',
      'Impossible to tell if that’s a miracle or a mis-click. Probably the second.',
      'That doesn’t look like your usual solve. The timer might have stopped by accident.'
    ],
    streak: [
      'Three faster in a row. Momentum!',
      'Getting quicker every solve. Don’t jinx it.',
      'Keep going. The trend is your friend.',
      'Faster again, {name}. That’s three in a row.',
      'The trend line is smiling.',
      '{time}, and each one quicker than the last.',
      'Three downs in a row. The graph loves this.',
      'You’re accelerating. Ride it.',
      'A hot streak. Don’t blink.',
      'Quicker, quicker, quicker. Why stop now?'
    ]
  };
  const MILESTONE = {
    10: ['Ten solves. A tiny streak is a streak.', 'Solve ten. Now it’s a session.', '10 solves in, {name}. Keep the rhythm.', 'Double digits! You’re officially cubing.'],
    25: ['25 solves. The averages have something to say now.', 'A quarter hundred. The graph has a shape.', 'Twenty-five solves, {name}. Nice session.', '25 done. Your cube is warm, and so are you.'],
    50: ['50 solves. Your cube has earned a lube break.', 'Fifty solves in. The corners are tired.', '50 solves, {name}. That’s a lot of cross.', 'Half a hundred. Your thumbs said hi.', '50 on the board. Hydrate.'],
    100: ['100 solves! Your thumbs have unionized.', 'Triple digits. This is officially a habit.', 'One hundred solves, {name}. Legendary.', '100 solves. You’ve earned a snack.', 'Century reached. Your cube salutes you.'],
    250: ['250 solves. That’s a lot of cross.', 'A quarter thousand. Your cube is a veteran now.', '250 solves on {puzzle}. The muscle memory is real.', '250, {name}. The stickers are starting to know your name.', 'Two hundred and fifty solves. That’s dedication.'],
    500: ['500 solves. The stickers are starting to fade.', 'Five hundred. Respect.', '500 solves, {name}. You could do this in your sleep. Please don’t.', 'Half a thousand. The cube is wearing in, and so are you.', '500 on {puzzle}. That’s a serious pile of practice.'],
    1000: ['1,000 solves. You’re basically a speedcuber now.', 'One thousand. Your cube sends its regards.', '1,000 solves, {name}. Take a bow, then take another solve.', 'A thousand solves on {puzzle}. The graph must look incredible.', 'Four digits. Your cube needs a new set of stickers.'],
    2500: ['2,500 solves. You and your cube are in a relationship.', '2,500, {name}. This is a lifestyle.', 'Two and a half thousand solves. The cube has seen things.', '2,500 on {puzzle}. Legend status.']
  };
  const THRESHOLDS = [5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 45, 60, 90, 120];

  // Official world-record SINGLES in milliseconds, by the app's event names. From the WCA records feed on 24 Oct 2026.
  // Records fall over time, so these are used as rough limits and are quoted only as "about N s", never as an exact record.
  const WR = { '3×3': 2510, '2×2': 390, '4×4': 15180, '5×5': 29490, '6×6': 57690, '7×7': 87470, Clock: 1530, Mega: 21040, Pyra: 730, Skewb: 730, 'Sq-1': 2850, OH: 5620, '3BLD': 11560 };
  const NAME = { '3×3': '3×3', '2×2': '2×2', '4×4': '4×4', '5×5': '5×5', '6×6': '6×6', '7×7': '7×7', Clock: 'Clock', Mega: 'Megaminx', Pyra: 'Pyraminx', Skewb: 'Skewb', 'Sq-1': 'Square-1', OH: '3×3 one-handed', '3BLD': '3×3 blindfolded' };

  const median = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const label = t => t >= 60 ? Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') : String(t);
  const sec2 = ms => (ms / 1000).toFixed(2);
  function fmt(ms) {
    const s = ms / 1000;
    if (!(s >= 60)) return s.toFixed(2);
    const m = Math.floor(s / 60);
    return m + ':' + (s - m * 60).toFixed(2).padStart(5, '0');
  }

  function classify(c) {
    const fin = (c.prev || []).filter(Number.isFinite);
    if (c.pen === 'DNF') return { tone: 'dnf', fx: 'dnf' };
    if (c.pen === '2') return { tone: 'plus2', fx: 'plus2' };
    const ms = c.ms, wr = WR[c.ev];
    // cube knowledge first: a time nobody has ever reached is not a personal best, it is a mis-stop
    if (wr && ms < 0.85 * wr) return { tone: 'impossible', fx: 'plus2' };
    if (wr && ms < wr) return { tone: 'nearwr', fx: 'plus2' };
    if (wr && ms < 1.3 * wr) return { tone: 'elite', fx: 'soft' };
    if (fin.length >= 3 && ms < 0.5 * median(fin.slice(-12))) return { tone: 'tooquick', fx: 'plus2' };
    if (!fin.length) return { tone: 'first', fx: 'blink' };
    const best = Math.min(...fin), worst = Math.max(...fin);
    if (ms < best) {
      if (fin.length < 5) return { tone: 'earlybest', fx: 'soft' };
      const crossed = THRESHOLDS.filter(t => ms < t * 1000 && best >= t * 1000);
      return crossed.length ? { tone: 'sub', fx: 'pb', thr: crossed[0] } : { tone: 'pb', fx: 'pb' };
    }
    if (fin.length >= 8 && ms > worst) return { tone: 'worst', fx: 'worst' };
    if (MILESTONE[c.total]) return { tone: 'milestone', fx: 'blink' };
    if (fin.length < 3) return { tone: 'early', fx: 'none' };
    const ref = median(fin.slice(-12)), r = ms / ref;
    const tail = fin.slice(-2);
    if (tail.length === 2 && tail[0] > tail[1] && tail[1] > ms && r <= 1.05) return { tone: 'streak', fx: 'soft' };
    if (r <= 0.9) return { tone: 'great', fx: 'blink' };
    if (r <= 0.97) return { tone: 'good', fx: 'soft' };
    if (r <= 1.05) return { tone: 'ok', fx: 'none' };
    if (r <= 1.15) return { tone: 'meh', fx: 'none' };
    return { tone: 'slow', fx: 'none' };
  }

  // every number a line may quote, or null when it would not be true
  function values(c, k) {
    const fin = (c.prev || []).filter(Number.isFinite), ms = c.ms;
    const med = fin.length >= 3 ? median(fin.slice(-12)) : null, best = fin.length ? Math.min(...fin) : null;
    return {
      name: (c.name || '').trim() || 'cuber',
      puzzle: c.ev ? (NAME[c.ev] || c.ev) : null,
      wr: WR[c.ev] ? fmt(WR[c.ev]) : null,
      med: med != null ? fmt(med) : null,
      time: Number.isFinite(ms) ? fmt(ms) : null,
      n: c.total ? Number(c.total).toLocaleString('en') : null,
      best: best != null ? fmt(best) : null,
      thr: k.thr ? label(k.thr) : null,
      diff: med != null && Number.isFinite(ms) ? sec2(Math.abs(ms - med)) : null,
      gap: best != null && Number.isFinite(ms) && ms > best ? sec2(ms - best) : null,
      by: best != null && Number.isFinite(ms) && ms < best ? sec2(best - ms) : null
    };
  }
  const fill = (line, v) => {
    let ok = true;
    const text = line.replace(/\{(\w+)\}/g, (m, key) => { if (v[key] == null) { ok = false; return m; } return v[key]; });
    return ok ? text : null;
  };

  function make(c, rnd) {
    rnd = rnd || Math.random;
    const k = classify(c), v = values(c, k);
    const pool = k.tone === 'milestone' ? MILESTONE[c.total] : POOL[k.tone];
    const avoid = new Set([...(c.recent || []), c.lastText].filter(Boolean));
    const all = pool.map(l => fill(l, v)).filter(Boolean);
    let options = all.filter(t => !avoid.has(t));
    if (!options.length) options = all.filter(t => t !== c.lastText);
    if (!options.length) options = all;
    const text = options[Math.floor(rnd() * options.length)];
    // the UI only needs a handful of tones for colour; fold the finer ones into them
    const ui = { earlybest: 'good', sub: 'pb', milestone: 'good', streak: 'good', first: 'good', early: 'ok', impossible: 'plus2', nearwr: 'plus2', tooquick: 'plus2', elite: 'good' }[k.tone] || k.tone;
    return { text, tone: ui, kind: k.tone, fx: k.fx, vals: v };
  }

  const count = () => Object.values(POOL).reduce((n, a) => n + a.length, 0) + Object.values(MILESTONE).reduce((n, a) => n + a.length, 0);
  const api = { make, classify, values, fmt, count, WR, POOL, MILESTONE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Quips = api;
})(typeof window !== 'undefined' ? window : globalThis);
