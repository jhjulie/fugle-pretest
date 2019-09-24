"use strict";
const redis = require("../caches/redis");
const timeUtil = require("../libs/time");

const topics = [
  "bac",
  "mdr",
  "chk",
  "amd",
  "ge",
  "roku",
  "ver",
  "f",
  "fb",
  "snap"
];
const sockets = {};
const recentTradinds = {};

const start = async http => {
  var io = require("socket.io")(http);
  const iexSubscribeKey = "iex_subscribers";
  let subscribers = await initSubscribe(iexSubscribeKey);

  setTimeout(async () => {
    await iex(iexSubscribeKey);
  }, 3000);

  // server
  io.use((socket, next) => {
    var handshakeData = socket.request;
    const user = handshakeData._query["user"];
    socket.user = user;
    console.log("user:", user);
    // maintain user -> socket
    sockets[user] = socket;
    next();
  });

  io.on("connection", async socket => {
    console.log("a user connected");
    socket.on("disconnect", function() {
      console.log("user disconnected");
      const { user } = socket;
      delete sockets[user];
    });
    socket.on("chat message", function(msg) {
      console.log("message: " + msg);
      io.emit("chat message", msg);
    });

    // 訂閱
    socket.on("subscribe", async msg => {
      const user = msg.split(",")[0];
      const topic = msg.split(",")[1];

      console.log(`subscribe: ${topic} from user: ${user}`);

      if (subscribers[topic]) {
        let clients = subscribers[topic];
        clients.push(user);
        subscribers[topic] = clients;
      } else {
        socket.emit(
          "chat message",
          `Subscribe failed. Invalid topic: ${topic}`
        );
      }
      await redis.set(iexSubscribeKey, JSON.stringify(subscribers));
    });

    // 取消訂閱
    socket.on("unsubscribe", async msg => {
      const user = msg.split(",")[0];
      const topic = msg.split(",")[1];
      console.log(`unsubscribe: ${topic} from user: ${user}`);
      if (subscribers[topic]) {
        let clients = subscribers[topic];
        clients = clients.filter(item => item !== user);
        subscribers[topic] = clients;
        await redis.set(iexSubscribeKey, JSON.stringify(subscribers));
      } else {
        "chat message", `Unsubscribe failed. Invalid topic: ${topic}`;
      }
    });
  });
};

const iex = async iexSubscribeKey => {
  // iex client
  const iexSocket = require("socket.io-client")(
    "https://ws-api.iextrading.com/1.0/last"
  );

  // Listen to the channel's messages
  iexSocket.on("message", async message => {
    console.log(message);
    try {
      const cache = await redis.get(iexSubscribeKey);
      let subscribers = {};
      if (cache) {
        subscribers = JSON.parse(cache);
      }

      const content = JSON.parse(message);
      const { symbol } = content;

      updateRecentTradings(content);
      const kInfo = getK(symbol);

      content.k = kInfo;

      const clients = subscribers[symbol.toLowerCase()];
      clients.forEach(user => {
        const socket = sockets[user];
        if (socket) {
          // socket.emit("chat message", message);
          socket.emit("chat message", JSON.stringify(content));
        }
      });
    } catch (error) {
      console.log(error);
    }
  });

  // Connect to the channel
  iexSocket.on("connect", () => {
    iexSocket.emit("subscribe", topics.join());
  });

  // Disconnect from the channel
  iexSocket.on("disconnect", () => console.log("Disconnected."));
};

const initSubscribe = async key => {
  const cache = await redis.get(key);
  let subscribers = {};
  if (!cache) {
    topics.forEach(topic => {
      subscribers[topic] = [];
    });
    await redis.set(key, JSON.stringify(subscribers));
  } else {
    subscribers = JSON.parse(cache);
    topics.forEach(topic => {
      if (!subscribers[topic]) {
        subscribers[topic] = [];
      }
    });
    await redis.set(key, JSON.stringify(subscribers));
  }
  return subscribers;
};

const updateRecentTradings = data => {
  const { symbol, price, time } = data;
  if (recentTradinds[symbol]) {
    const tsNow = timeUtil.timestampNow();
    let contents = recentTradinds[symbol];

    // drop old data
    contents = contents.filter(item => item.time < (tsNow - 60) * 1000);
    contents.push({ price, time });

    recentTradinds[symbol] = contents;
  } else {
    recentTradinds[symbol] = [{ price, time }];
  }
};

const getK = symbol => {
  const contents = recentTradinds[symbol];
  const size = contents.length;
  const priceOrderContents = contents.sort((a, b) => a.price - b.price);

  return [
    contents[0].price,
    priceOrderContents[size - 1].price,
    priceOrderContents[0].price,
    contents[size - 1].price
  ];
};

module.exports = { start };
