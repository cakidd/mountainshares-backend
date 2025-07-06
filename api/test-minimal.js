module.exports = (req, res) => {
  res.status(200).json({ success: true, message: "Test minimal handler works!" });
};

