const moduleName = "userList";
const fs = require("../../util/fsUtil");
const _ = require("lodash");
const api = {
  async login(user) {
    const userList = fs.read(moduleName);
    let userForLogin = _.find(userList, function(d) {
      return d.name === user.name;
    });
    if (!userForLogin) {
      throw new Error("用户不存在");
    }
    if (userForLogin.password !== user.password) {
      throw new Error("密码错误");
    }
    return userForLogin;
  },
  async register(user) {
    user["id"] = userList.length + 1;
    userList.push(user);
    fs.insert(moduleName, user, userList => {
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
        return !query.userId || d.userId == query.userId;
      })
      .value();
    return list;
  },
  async get(userId) {
    let list = fs.read(moduleName);
    let item = _.chain(list)
      .find(d => {
        return d.id == userId;
      })
      .value();
    return item;
  }
};

module.exports = exports = api;
