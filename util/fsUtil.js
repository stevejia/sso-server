const fs = require("fs");
const basePath = "./data/";
const _ = require("lodash");
const fsUtil = {
  insert(fileName, data, callback) {
    let models = [];
    if (!(data instanceof Array)) {
      models = [data];
    } else {
      models = [...data];
    }

    let filePath = `${basePath}${fileName}.json`;
    let exists = fs.existsSync(filePath);
    let list = [];
    if (!exists) {
      _.forEach(models, (model, i) => {
        model["id"] = i + 1;
      });
      list = models;
    } else {
      list = fsUtil.read(fileName);

      _.forEach(models, (model, i) => {
        model["id"] = list.length + i + 1;
      });
      list = [...list, ...models];
    }
    let message = null;
    if (callback) {
      message = callback(list);
    }
    if (message) {
      throw new Error(message);
    }
    fs.writeFileSync(filePath, JSON.stringify(list));
    return models;
  },
  update(fileName, model, callback) {
    let filePath = `${basePath}${fileName}.json`;
    let exists = fs.existsSync(filePath);
    if (!exists) {
      throw new Error("要更新的记录表不存在");
    }
    let list = fsUtil.read(fileName);
    let message = null;
    if (callback) {
      message = callback(list);
    }
    if (message) {
      throw new Error(message);
    }
    _.forEach(list, (d, i) => {
      if (d.id === model.id) {
        list[i] = { ...model };
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(list));
  },
  get(fileName, id, callback) {
    let list = fsUtil.read(fileName);
    let item = _.find(list, d => {
      return d.id == id;
    });
    return item || null;
  },
  read(fileName, type = "array") {
    let filePath = `${basePath}${fileName}.json`;
    let exists = fs.existsSync(filePath);
    let list = [];
    if (exists) {
      list = JSON.parse(fs.readFileSync(filePath));
    }
    return list.filter(d => {
      return !d.isDeleted;
    });
  }
};
module.exports = exports = fsUtil;
