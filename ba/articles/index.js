const moduleName = "articles";
const fs = require("../../util/fsUtil");
const _ = require("lodash");
const api = {
  async create(data) {
    fs.insert(moduleName, data, list => {
      //validate
      data.createTime = new Date();
      return null;
    });
  },
  async update() {
    fs.update(moduleName, data, list => {
      //validate
      data.updateTime = new Date();
      return null;
    });
  },
  async list(query) {
    let list = fs.read(moduleName);
    list = _.chain(list)
      .filter(d => {
        return !query.creatorId || d.creatorId == query.creatorId;
      })
      .filter(d => {
        return !query.articleType || d.articleType == query.articleType;
      })
      .filter(d => {
        return (
          !query.classify ||
          _.filter(d.classifies, r => {
            return r.id == query.classify;
          }).length > 0
        );
      })
      .value();
    return list;
  },
  async get(id) {
    let list = fs.read(moduleName);
    let item = _.find(list, d => {
      return d.id === +id;
    });
    return item;
  }
};

module.exports = exports = api;
