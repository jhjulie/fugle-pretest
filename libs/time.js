const moment = require("moment-timezone");
const timezone = "Asia/Taipei";
const format = "YYYY-MM-DD HH:mm:ss";

const self = {
  formatNow: () => {
    return moment()
      .tz(timezone)
      .format(format);
  },

  secondNow: () => {
    return moment().second();
  },

  timestampNow: () => {
    return moment().unix();
  }
};

module.exports = self;
