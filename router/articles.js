const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./auth");
const http = require("../utils/http");
const fs = require("../util/fsUtil");
const _ = require("lodash");
const tokenGen = require("../util/token");
const fileName = "articles";
router.post(
  "/save",
  wrap(async function(req, res) {
    let data = req.body;
    if (!!data.id) {
      fs.update(fileName, data, list => {
        //validate logic here.
        data.updateTime = new Date();
        return null;
      });
    } else {
      fs.insert(fileName, data, list => {
        data.createTime = new Date();
        return null;
      });
    }
    res.status(200).send();
  })
);
router.get(
  "/list",
  wrap(async function(req, res) {
    let list = fs.read(fileName);
    res.status(200).send({ list });
    return;
  })
);
router.get(
  "/get",
  wrap(async function(req, res) {
    let list = fs.read(fileName);
    let item = _.find(list, d => {
      return d.id === +req.query.id;
    });
    res.status(200).send({ item });
    return;
  })
);

router.post(
  "/savecomment",
  wrap(async function(req, res) {
    let comment = req.body;
    comment.createTime = new Date();
    fs.insert("articleComments", comment, list => {});
    res.status(200).send();
    return;
  })
);

router.get(
  "/listcomments",
  wrap(async function(req, res) {
    let id = req.query.id;
    let list = fs.read("articleComments");
    list = _.filter(list, d => {
      return d.articleId === id;
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
    res.status(200).send({ list: rootList });
    return;
  })
);
module.exports = exports = router;
