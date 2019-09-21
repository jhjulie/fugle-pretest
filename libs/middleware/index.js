"use strict";
const redis = require("../../caches/redis");
const time = require("../time");

const self = {
  validUser: (req, res, next) => {
    if (!req.query.user) {
      return res.sendStatus(400);
    }
    const user_id = Number(req.query.user);
    if (user_id < 1 || user_id > 1000) {
      return res.sendStatus(401);
    }
    next();
  },

  setReqCount: async (req, res, next) => {
    const user_id = req.query.user;
    const ip = req.ip;
    const userReqKey = `user:${user_id}:requests`;
    const ipReqKey = `ip:${ip}:requests`;
    const userCache = await redis.get(userReqKey);
    const ipCache = await redis.get(ipReqKey);
    const expire = 60 - time.secondNow();

    if (!userCache) {
      await redis.set(userReqKey, 1, "EX", expire);
    } else {
      await redis.incr(userReqKey);
    }

    if (!ipCache) {
      await redis.set(ipReqKey, 1, "EX", expire);
    } else {
      await redis.incr(ipReqKey);
    }
    next();
  },

  rateLimit: async (req, res, next) => {
    const user_id = req.query.user;
    const ip = req.ip;
    const userReqKey = `user:${user_id}:requests`;
    const ipReqKey = `ip:${ip}:requests`;
    const userCache = await redis.get(userReqKey);
    const ipCache = await redis.get(ipReqKey);

    if (userCache > 5 || ipCache > 10) {
      res.status(403);
      res.json({ ip: Number(ipCache), id: Number(userCache) });
      return;
    }
    next();
  }
};

module.exports = self;
