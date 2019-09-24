const express = require("express");
const app = express();
const http = require("http").createServer(app);
const ws = require("./ws");

const bodyParser = require("body-parser");
const { json, urlencoded } = bodyParser;
const data = require("./routes/data");

app.use(json());
app.use(urlencoded({ extended: false }));

process.on("uncaughtException", function(err) {
  console.error(err); // handle the error safely
});

app.use("/data", data);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

// app.listen(3000, function() {
//   console.log("Listening on port 3000");
// });

http.listen(3001, function() {
  console.log("listening on *:3001");
});

ws.start(http);
