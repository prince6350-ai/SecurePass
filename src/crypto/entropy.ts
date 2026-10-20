/**
 * Entropy & Master Secret Strength Analyzer
 * 
 * Master secrets in deterministic derivation are the single root of security.
 * This module computes estimated brute-force search space (bits of entropy)
 * and warns the user if the secret does not meet security baselines.
 */

export interface EntropyReport {
  bits: number;
  score: 0 | 1 | 2 | 3 | 4; // 0: Very Weak, 1: Weak, 2: Moderate, 3: Strong, 4: Excellent
  label: string;
  color: string;
  feedback: string;
  isSafeForMasterSecret: boolean;
}

export function evaluateMasterSecretEntropy(secret: string): EntropyReport {
  if (!secret || secret.length === 0) {
    return {
      bits: 0,
      score: 0,
      label: 'Empty',
      color: 'text-zinc-500',
      feedback: 'Enter a strong, private master secret. It is never stored.',
      isSafeForMasterSecret: false,
    };
  }

  // Calculate character pool variety
  let poolSize = 0;
  if (/[a-z]/.test(secret)) poolSize += 26;
  if (/[A-Z]/.test(secret)) poolSize += 26;
  if (/[0-9]/.test(secret)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(secret)) poolSize += 33;

  if (poolSize === 0) poolSize = 10;

  // Approximate Shannon/combinatorial entropy
  const bits = Math.round(secret.length * Math.log2(poolSize));

  // Common weak trivial words (only penalize if exact match or very short)
  const lower = secret.toLowerCase().trim();
  const isExactCommon = ['password', '123456', '12345678', 'admin', 'qwerty', 'secret', 'securepass', 'masterkey'].includes(lower);
  const isTooShort = secret.length < 10;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label = 'Very Weak';
  let color = 'text-red-400';
  let feedback = 'Too short or predictable. Use at least 12-16 characters or a multi-word passphrase.';
  let isSafe = false;

  if (isExactCommon || bits < 30 || secret.length < 8) {
    score = 0;
    label = 'Very Weak';
    color = 'text-red-400';
    feedback = 'Too short or predictable. Master secret must be at least 12+ chars to prevent brute-force.';
    isSafe = false;
  } else if (bits < 45 || isTooShort) {
    score = 1;
    label = 'Moderate';
    color = 'text-amber-400';
    feedback = 'Fair entropy, but 14+ characters offer substantially stronger GPU protection.';
    isSafe = true;
  } else if (bits < 75) {
    score = 2;
    label = 'Strong';
    color = 'text-emerald-400';
    feedback = 'High entropy. Solid resistance against hash-cracking clusters.';
    isSafe = true;
  } else if (bits < 100) {
    score = 3;
    label = 'Very Strong';
    color = 'text-emerald-300';
    feedback = 'Extremely high entropy. Cryptographically robust.';
    isSafe = true;
  } else {
    score = 4;
    label = 'Military Grade / Hardened';
    color = 'text-cyan-300';
    feedback = 'Maximum security. Keyspace exceeds theoretical brute-force capability.';
    isSafe = true;
  }

  return {
    bits,
    score,
    label,
    color,
    feedback,
    isSafeForMasterSecret: isSafe,
  };
}
