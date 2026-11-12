import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '1m', target: 60 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:30739';

export default function () {
  const res = http.get(`${BASE_URL}/api/catalog`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.2);
}
