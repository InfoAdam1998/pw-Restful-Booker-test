/**
 * Reusable k6 load profiles ("scenarios").
 *
 * Each exported object is a preset for k6's `options` — it controls how many
 * Virtual Users (VUs, i.e. simulated concurrent users) run the test's default
 * function, and for how long. A test file picks one profile and spreads it
 * into its own `options`, e.g. `export const options = { ...load, thresholds };`
 *
 * Two shapes are used here:
 *  - `{ vus, duration }`      — a flat run: a fixed number of VUs for a fixed time.
 *  - `{ stages: [...] }`      — a ramping run: VUs change over a series of steps,
 *                               each step being `{ duration, target }` (target = VU
 *                               count to ramp to by the end of that step).
 */

// Smoke test — the smallest possible run, just to confirm the script and the
// API endpoint work at all before running anything heavier. 1 user, 30 seconds.
export const smoke = {
    vus: 1,
    duration: '30s',
}

// Load test — simulates normal, expected traffic. Ramps up gradually, holds
// a steady number of users, then ramps back down (so results aren't skewed
// by every VU starting or stopping at the same instant).
export const load = {
    stages: [
        { duration: '30s', target: 10 }, // ramp up from 0 to 10 VUs over 30s
        { duration: '1m', target: 20 },  // continue ramping up to, and hold at, 20 VUs for 1 minute
        { duration: '30s', target: 0 },  // ramp back down to 0 VUs
    ]
}

// Stress test — pushes well beyond normal load to find the point where
// performance degrades or errors start appearing.
export const stress = {
    stages: [
        { duration: '1m', target: 10 }, // ramp up to 10 VUs
        { duration: '1m', target: 50 }, // ramp up to, and hold at, 50 VUs
        { duration: '1m', target: 0 },  // ramp back down to 0 VUs
    ]
}

// Spike test — simulates a sudden burst of traffic (e.g. a marketing push)
// to see how the system copes with a sharp, short-lived surge.
export const spike = {
    stages: [
        { duration: '10s', target: 5 },  // baseline: 5 VUs
        { duration: '10s', target: 60 }, // sudden spike up to 60 VUs
        { duration: '10s', target: 5 },  // drop back down to baseline
    ]
}
