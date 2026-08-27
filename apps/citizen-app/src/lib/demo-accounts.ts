// Hackathon-demo account, mirroring apps/web/src/lib/demo-accounts.ts. For the
// SIH demo a visitor should not have to type credentials to see the app work.
// This signs into a pre-created real account on the live backend, so real auth
// (JWT issue, role checks) still runs end to end — only the typing is skipped.
export const DEMO_CITIZEN = {
  email: "demo-citizen@aapdamitra.demo",
  password: "DemoCitizen#2026",
};
