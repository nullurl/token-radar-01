// Tests for the token radar's model (Node's built-in runner, no dependencies):
//   node --test tests/model.test.ts
// The model is pure functions over a snapshot, so every test builds a small synthetic snapshot and
// asserts on the numbers, never on the sealed input.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL,
  boardIssue,
  buildBoard,
  deriveMultiples,
  farmSteps,
  impliedValue,
  median,
  parseSnapshot,
  validateModel,
  type Snapshot,
  type SnapshotProtocol,
} from '../lib/model.ts';

function protocol(overrides: Partial<SnapshotProtocol> = {}): SnapshotProtocol {
  return {
    slug: 'test-protocol',
    name: 'Test Protocol',
    category: 'Lending',
    chains: ['Ethereum'],
    tvl_usd: 100_000_000,
    change_7d: 0,
    mcap_usd: null,
    listed_at: '2025-11-14',
    gecko_id: null,
    symbol: null,
    ...overrides,
  };
}

function snapshot(protocols: SnapshotProtocol[], watchlist: string[] = []): Snapshot {
  return { as_of: '2026-11-14', source: 'test', floor_usd: 50_000_000, protocols, watchlist };
}

test('median: odd, even and empty lists', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), 0);
});

test('deriveMultiples: a category median where 3+ live protocols carry it, else the global median', () => {
  const live = (slug: string, category: string, tvl: number, mcap: number): SnapshotProtocol =>
    protocol({ slug, name: slug, category, tvl_usd: tvl, mcap_usd: mcap });
  const s = snapshot([
    live('a', 'Lending', 100, 10),
    live('b', 'Lending', 100, 20),
    live('c', 'Lending', 100, 30),
    live('d', 'Dexs', 100, 90),
    live('e', 'Dexs', 100, 50),
  ]);
  const { global, byCategory } = deriveMultiples(s);
  // Lending has 3 live protocols: median of 0.1, 0.2, 0.3 is 0.2.
  assert.equal(byCategory.get('Lending')?.multiple, 0.2);
  assert.equal(byCategory.get('Lending')?.n, 3);
  // Dexs has only 2: no category multiple, so it falls back to the global median of all five (0.3).
  assert.equal(byCategory.has('Dexs'), false);
  assert.equal(global, 0.3);
});

test('deriveMultiples: multiples clamp to the model band', () => {
  const live = (slug: string, tvl: number, mcap: number): SnapshotProtocol =>
    protocol({ slug, name: slug, category: 'Lending', tvl_usd: tvl, mcap_usd: mcap });
  const s = snapshot([live('a', 100, 500), live('b', 100, 600), live('c', 100, 700)]);
  const { byCategory } = deriveMultiples(s);
  assert.equal(byCategory.get('Lending')?.multiple, MODEL.multiple_cap);
});

test('impliedValue: a hand-computed row', () => {
  const s = snapshot([protocol()]);
  const multiples = deriveMultiples(s);
  // No live protocol in the snapshot: the global median is 0, clamped to the floor 0.05.
  assert.equal(multiples.global, MODEL.multiple_floor);
  const { implied } = impliedValue(protocol(), s.as_of, MODEL, multiples);
  // 100M TVL x 0.05 x 1.0 growth x (0.6 + 365/1095 x 0.4) maturity x 1.0 breadth, rounded.
  assert.equal(implied, 3_666_667);
});

test('impliedValue: growth, age and breadth each raise the value', () => {
  const s = snapshot([protocol()]);
  const multiples = deriveMultiples(s);
  const base = impliedValue(protocol(), s.as_of, MODEL, multiples).implied;
  const grown = impliedValue(protocol({ change_7d: 50 }), s.as_of, MODEL, multiples).implied;
  const older = impliedValue(protocol({ listed_at: '2020-11-14' }), s.as_of, MODEL, multiples).implied;
  const wider = impliedValue(protocol({ chains: ['Ethereum', 'Base', 'Solana'] }), s.as_of, MODEL, multiples).implied;
  assert.ok(grown > base, 'growth raises the value');
  assert.ok(older > base, 'age raises the value');
  assert.ok(wider > base, 'breadth raises the value');
});

test('buildBoard: the watchlist is covered, ranks are 1..n, values do not rise', () => {
  const wl = protocol({ slug: 'watch-one', name: 'Watch One' });
  const early = protocol({ slug: 'early-one', name: 'Early One', tvl_usd: 10_000_000 });
  const board = buildBoard(snapshot([wl, early], ['watch-one']));
  assert.equal(board.length, 2);
  assert.deepEqual(board.map((r) => r.rank), [1, 2]);
  assert.ok(board.some((r) => r.slug === 'watch-one'));
  assert.ok(board[0]!.implied_value_usd >= board[1]!.implied_value_usd);
  assert.equal(boardIssue(board, snapshot([wl, early], ['watch-one'])), null);
});

test('boardIssue: a missing watchlist slug is refused', () => {
  const board = buildBoard(snapshot([protocol()], []));
  const issue = boardIssue(board, snapshot([protocol()], ['not-on-the-board']));
  assert.match(issue ?? '', /misses 1 watchlist slug/);
});

test('farmSteps: seven steps, each within 20..600 characters, with a category action', () => {
  const steps = farmSteps(protocol({ category: 'Lending' }), 365).map((s) => `${s.text} Cost: ${s.cost}. Time: ${s.time}.`);
  assert.equal(steps.length, 7);
  for (const s of steps) assert.ok(s.length >= 20 && s.length <= 600, `step of ${s.length} characters`);
  assert.match(steps[1]!, /Supply/);
  const falling = farmSteps(protocol({ change_7d: -12.5 }), 100);
  assert.match(falling[5]!.text, /TVL fell 12\.5%/);
});

test('validateModel: the house model passes, an out-of-range override fails', () => {
  assert.equal(validateModel(MODEL), null);
  assert.match(validateModel({ ...MODEL, growth_weight: 5 }) ?? '', /growth_weight/);
  assert.match(validateModel({ ...MODEL, multiple_cap: 0.01 }) ?? '', /multiple_cap/);
});

test('parseSnapshot: a valid document parses, a negative TVL is refused', () => {
  const parsed = parseSnapshot(JSON.stringify(snapshot([protocol()], ['test-protocol'])));
  assert.equal(parsed.protocols.length, 1);
  assert.throws(
    () => parseSnapshot(JSON.stringify(snapshot([protocol({ tvl_usd: -1 })]))),
    /negative TVL/,
  );
  assert.throws(() => parseSnapshot('not json'), /not JSON/);
});
