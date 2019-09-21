const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const data = { result: [1] };
  res.json(data);
});

module.exports = router;
