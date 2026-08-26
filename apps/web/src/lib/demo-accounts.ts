// Hackathon-demo accounts: for the SIH demo, visitors should not have to sign
// up or log in to see the app work. These clicking-through credentials sign
// into pre-created real accounts on the live backend, so real auth/authorization
// (JWT, role checks) still runs end to end — only the visible login step is
// skipped for the demo.
export const DEMO_CITIZEN = { email: "demo-citizen@aapdamitra.demo", password: "DemoCitizen#2026" };
export const DEMO_AUTHORITY = { email: "demo-authority@aapdamitra.demo", password: "DemoAuthority#2026" };
