import { check, sleep } from "k6";
import http from "k6/http";

// Smoke test: light load to verify the API handles concurrent requests
// Run: k6 run tests/load/smoke.js
// With env: k6 run -e BASE_URL=https://api.example.com tests/load/smoke.js

export const options = {
  stages: [
    { duration: "10s", target: 5 }, // ramp up to 5 VUs
    { duration: "30s", target: 5 }, // hold at 5 VUs
    { duration: "10s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"], // 95% of requests under 200ms
    http_req_failed: ["rate<0.01"], // <1% error rate
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Health check
  const health = http.get(`${BASE}/health`);
  check(health, {
    "health status 200": (r) => r.status === 200,
    "health body ok": (r) => r.json().status === "ok",
  });

  // Readiness
  const ready = http.get(`${BASE}/health/ready`);
  check(ready, {
    "ready status 200": (r) => r.status === 200,
    "ready body true": (r) => r.json().ready === true,
  });

  // 404 handling
  const notFound = http.get(`${BASE}/nonexistent`);
  check(notFound, {
    "404 status": (r) => r.status === 404,
  });

  sleep(1);
}
