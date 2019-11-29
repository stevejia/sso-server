const moduleName = "classifies";
const fs = require("../../util/fsUtil");
const _ = require("lodash");
const api = {
  async create(data) {
    let items = fs.insert(moduleName, data, list => {
      //validate
      data.createTime = new Date();
      return null;
    });
    return items;
  },
  async list(query) {
    let list = fs.read(moduleName);
    list = _.chain(list)
      .filter(d => {
        return !query.userId || d.userId == query.userId;
      })
      .value();
    return list;
  }
};

module.exports = exports = api;
