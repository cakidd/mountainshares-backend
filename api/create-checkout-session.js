module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.mountainshares.us');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ success: true, message: "Minimal handler works!" });
};
