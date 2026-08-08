/**
 * Shared k6 thresholds — the pass/fail "quality gates" for every performance test.
 *
 * A threshold is a rule k6 checks against a metric once the test finishes.
 * If any rule fails, k6 exits with a non-zero status code, which is what
 * makes this suite usable as a CI gate (a CI job can fail the build on
 * regressions instead of relying on someone reading the report by hand).
 *
 * Import this into a test file and spread it into that file's `options`,
 * e.g. `export const options = { ...load, thresholds };`
 */
export const thresholds = {
    // 95% of all requests must finish in under 800ms. `p(95)` is the 95th
    // percentile, i.e. only the slowest 5% of requests are allowed to exceed it.
    http_req_duration: ['p(95)<800'],

    // Fewer than 1% of requests may fail (non-2xx/3xx status or network error).
    http_req_failed: ['rate<0.01'],
}
