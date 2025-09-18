import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 5 },  // ramp up to 5 users in 30s
    { duration: "1m", target: 10 },  // ramp up further to 10 users
    { duration: "30s", target: 0 },  // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<15000"], // 95% of requests < 15s (AI realistic)
    checks: ["rate>0.95"],              // at least 95% of checks must pass
  },
};

function generateLargeNotes(size = 5000) {
  const baseLine = "- Decision: Stress testing long input. ";
  const actionLine = "- Action: John to complete task by next Friday. ";
  let text = "Team Planning – Q2 Stress Test\n\nKey Decisions:\n";
  while (text.length < size) {
    text += baseLine + actionLine;
  }
  return text.slice(0, size);
}

export default function () {
  const url = "http://localhost:3000/process-meeting";
  const payload = JSON.stringify({
    text: generateLargeNotes(),
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response not empty": (r) => r.body && r.body.length > 0,
    "has success field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });
}
