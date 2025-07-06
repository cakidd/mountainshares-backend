// api/create-checkout-session.js

const ALLOWED_ORIGINS = [
  "https://www.mountainshares.us"
  // Add more origins if needed
];

module.exports = (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // --- Your real handler logic here ---
  res.status(200).json({ success: true, message: "Minimal handler works!" });
};
