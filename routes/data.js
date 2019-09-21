const express = require("express");
const router = express.Router();
const request = require("request-promise");

router.get("/", async (req, res) => {
  try {
    const uri =
      "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty";
    const options = {
      uri,
      method: "GET",
      json: true
    };
    const result = await request(options);
    const data = { result };
    res.json(data);
  } catch (error) {
    res.status(500);
  }
});

module.exports = router;
