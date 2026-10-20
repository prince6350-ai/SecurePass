import test from 'node:test';
import assert from 'node:assert/strict';
import {
  derivePassword,
  normalizeIdentifier,
  SHARED_TEST_VECTORS,
  CHARSET_LOWER,
  CHARSET_UPPER,
  CHARSET_DIGITS,
  CHARSET_SYMBOLS_FULL,
} from './generator.ts';

test('normalizeIdentifier cleans URLs and paths correctly', () => {
  assert.equal(normalizeIdentifier('https://github.com/login'), 'github.com');
  assert.equal(normalizeIdentifier('http://EXAMPLE.COM/path?query=1'), 'example.com');
  assert.equal(normalizeIdentifier('  accounts.google.com/signin  '), 'accounts.google.com');
  assert.equal(normalizeIdentifier('personal-vault'), 'personal-vault');
});

test('Shared test vectors reproduce exact expected outputs', async () => {
  for (const vector of SHARED_TEST_VECTORS) {
    const res = await derivePassword({
      masterSecret: vector.masterSecret,
      accountIdentifier: vector.identifier,
      length: vector.length,
      profile: vector.profile,
      generation: vector.generation,
    });
    assert.equal(
      res.password,
      vector.expectedPassword,
      `Failed vector: ${vector.title} expected ${vector.expectedPassword} got ${res.password}`
    );
  }
});

test('Determinism: Identical inputs always produce identical passwords', async () => {
  const secret = 'TestMasterSecret987!';
  const site = 'twitter.com';

  const run1 = await derivePassword({ masterSecret: secret, accountIdentifier: site, length: 24 });
  const run2 = await derivePassword({ masterSecret: secret, accountIdentifier: site, length: 24 });
  const run3 = await derivePassword({ masterSecret: secret, accountIdentifier: site, length: 24 });

  assert.equal(run1.password, run2.password);
  assert.equal(run2.password, run3.password);
  assert.equal(run1.password.length, 24);
});

test('Domain separation: Different sites produce distinct passwords', async () => {
  const secret = 'TestMasterSecret987!';
  const p1 = await derivePassword({ masterSecret: secret, accountIdentifier: 'site-a.com' });
  const p2 = await derivePassword({ masterSecret: secret, accountIdentifier: 'site-b.com' });
  assert.notEqual(p1.password, p2.password);
});

test('Password rotation: generation counters produce distinct passwords', async () => {
  const secret = 'TestMasterSecret987!';
  const site = 'github.com';
  const gen1 = await derivePassword({ masterSecret: secret, accountIdentifier: site, generation: 1 });
  const gen2 = await derivePassword({ masterSecret: secret, accountIdentifier: site, generation: 2 });
  assert.notEqual(gen1.password, gen2.password);
});

test('Character category enforcement: full profile includes lower, upper, digit, symbol', async () => {
  const res = await derivePassword({
    masterSecret: 'SimpleSecret123',
    accountIdentifier: 'bank.com',
    length: 16,
    profile: 'full',
  });
  const pwd = res.password;
  assert.equal(pwd.length, 16);
  assert.ok([...CHARSET_LOWER].some(c => pwd.includes(c)), 'Must contain lowercase');
  assert.ok([...CHARSET_UPPER].some(c => pwd.includes(c)), 'Must contain uppercase');
  assert.ok([...CHARSET_DIGITS].some(c => pwd.includes(c)), 'Must contain digit');
  assert.ok([...CHARSET_SYMBOLS_FULL].some(c => pwd.includes(c)), 'Must contain symbol');
});

test('Empty identifier: derives deterministically using default fixed salt', async () => {
  const secret = 'MySuperSecretMasterKey2026!';
  const res1 = await derivePassword({ masterSecret: secret, accountIdentifier: '' });
  const res2 = await derivePassword({ masterSecret: secret }); // omitted completely
  const res3 = await derivePassword({ masterSecret: secret, accountIdentifier: '   ' }); // whitespace

  assert.equal(res1.password, 'fjZ+Y0*g^=70Z=x$');
  assert.equal(res2.password, 'fjZ+Y0*g^=70Z=x$');
  assert.equal(res3.password, 'fjZ+Y0*g^=70Z=x$');
  assert.equal(res1.isDefaultIdentifier, true);
  assert.equal(res1.normalizedIdentifier, 'default');
});

test('Error handling: empty master secret throws error', async () => {
  await assert.rejects(async () => {
    await derivePassword({ masterSecret: '', accountIdentifier: 'github.com' });
  }, /Master secret is required/);
});
