"use strict";

const Redis = require("ioredis");
// const logger = require("../../logs")("server");
// const config = require("../../config");
// const { activity } = config.redis;
// const { cluster, hosts, tls, password } = activity;

const cluster = "false";
const hosts = "127.0.0.1:6379";
const password = "";

const options = { redisOptions: {} };
if (password !== "" && tls === "TRUE") {
  options.redisOptions = {
    password
  };
}
const nodes = [];
hosts.split(",").forEach(item => {
  const host = item.split(":")[0];
  const port = item.split(":")[1];
  nodes.push({
    host,
    port
  });
});
let client = {};
if (cluster === "TRUE") {
  console.info(`[REDIS] connect to redis cluster: ${hosts}`);
  client = new Redis.Cluster(nodes, options);
} else {
  console.info(`[REDIS] connect to redis: ${hosts}`);
  client = new Redis({
    host: nodes[0].host,
    port: nodes[0].port,
    password
  });
}

client.on("connect", () => {
  console.info(`[REDIS] connect to redis server successful`);
});

client.on("error", error => {
  console.error(error.message);
  console.error(`[REDIS] connect to redis server fail, process exit`);
  process.exit();
});

module.exports = client;
