const moduleName = "articleComments";
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
  async list(articleId) {
    let list = fs.read(moduleName);
    list = _.filter(list, d => {
      return d.articleId === articleId;
    });
    let rootList = _.filter(list, d => {
      return !d.parentId;
    });
    let chidList = _.filter(list, d => {
      return !!d.parentId;
    });
    _.forEach(rootList, d => {
      d.show = false;
      d.showReplies = false;
      d.replies = _.filter(chidList, r => {
        r.show = false;
        return +r.parentId === +d.id;
      });
    });
    return rootList;
  },
  async query(query) {
    let list = fs.read(moduleName);
    _.chain(list).filter(d => {
      d.userId == query.commentUserId;
    });
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
