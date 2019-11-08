const fs = require("fs");
const basePath = "./data/";
const _ = require("lodash");
const fsUtil = {
  insert(fileName, model, callback) {
    let filePath = `${basePath}${fileName}.json`;
    let exists = fs.existsSync(filePath);
    let list = [];
    if (!exists) {
      model["id"] = 1;
      list = [model];
    } else {
      list = fsUtil.read(fileName);
      let message = null;
      if (callback) {
        message = callback(list, model);
      }
      if (message) {
        throw new Error(message);
      }
      model["id"] = list.length + 1;
      list.push(model);
      fs.writeFileSync(filePath, JSON.stringify(list));
    }

    let message = null;
    if (callback) {
      message = callback(list);
    }
    if (message) {
      throw new Error(message);
    }
    _.forEach(list, d => {
      if (d.id === model.id) {
        d = model;
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(list));
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
