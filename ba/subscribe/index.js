const moduleName = "subscribe";
const fs = require("../../util/fsUtil");
const _ = require("lodash");
const api = {
  async register(user) {
    user["id"] = userList.length + 1;
    userList.push(user);
    fs.insert(fileName, user, userList => {
      let existUser = _.find(userList, function(d) {
        return d.name === user.name;
      });
      if (!!existUser) {
        throw new Error("用户名已存在");
      }
    });
  },
  async list(query) {
    let list = fs.read(moduleName);
    list = _.chain(list)
      .filter(d => {
        return !query.userId || d.id == query.userId;
      })
      .value();
    return list;
  },
  async get(userId) {
    let list = fs.read(moduleName);
    let item = _.chain(list)
      .find(d => {
        return d.userId == userId;
      })
      .value();
    return item;
  }
};

module.exports = exports = api;
