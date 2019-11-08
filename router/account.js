const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./auth");
const http = require("../utils/http");
// const fs = require("fs");
const fs = require("../util/fsUtil");
const _ = require("lodash");
const tokenGen = require("../util/token");

const YUAN_CHUANG = 1;
const fileName = "userList";
router.post(
  "/login",
  wrap(async function(req, res) {
    let user = req.body;
    const userList = fs.read(fileName);
    let userForLogin = _.find(userList, function(d) {
      return d.name === user.name;
    });
    if (!userForLogin) {
      res.status(500).send("用户不存在");
      return;
    }
    if (userForLogin.password !== user.password) {
      res.status(500).send("密码错误");
      return;
    }
    let token = tokenGen.createToken({
      userName: userForLogin.name,
      userId: userForLogin.id
    });
    localStorage.setItem(`${userForLogin.id}`, token);
    console.log(token);
    res.status(200).send({ token, userInfo: userForLogin });
  })
);
router.post(
  "/register",
  wrap(async function(req, res) {
    let user = req.body;
    const userList = fs.read(fileName);
    let existUser = _.find(userList, function(d) {
      return d.name === user.name;
    });
    if (!!existUser) {
      res.status(500).send("用户名已存在");
      return;
    }
    user["id"] = userList.length + 1;
    userList.push(user);
    fs.insert(fileName, user, list => {
      console.log("aaaa");
    });
    res.status(200).send();
    return;
  })
);
router.get(
  "/check",
  wrap(async function(req, res) {
    var token = localStorage.getItem("admin_token");
    if (!token) {
      res.sendStatus(401);
      return;
    }
    var data = await http.get("account/CheckLogin", { oldToken: token });
    var newToken = data.Data.newToken;
    localStorage.setItem("admin_token", newToken);
    res.sendStatus(200);
    return;
  })
);
router.post(
  "/logout",
  wrap(async function(req, res) {
    var token = localStorage.getItem("admin_token");
    await http.get("account/CheckLogin", { oldToken: token });
    localStorage.removeItem("admin_token");
    res.sendStatus(200);
    return;
  })
);

router.get(
  "/getByArticleId",
  wrap(async function(req, res) {
    let list = fs.read("articles");
    let item = _.find(list, d => {
      return d.id === +req.query.id;
    });
    let userId = item.creatorId;
    let userList = fs.read("userList");
    let user = _.find(userList, d => {
      return +d.id === +userId;
    });
    let userArticleList = _.filter(list, d => {
      return d.creatorId === userId;
    });

    let newestArticles = _.chain(userArticleList)
      .sortBy("createTime")
      .reverse()
      .filter((d, i) => {
        return i < 5;
      })
      .value();
    let originalCount = userArticleList.filter(d => {
      return +d.articleType === YUAN_CHUANG;
    }).length;

    let subscribeList = fs.read("subscribe");
    let userSubList = _.filter(subscribeList, d => {
      return d.id == userId;
    });
    res.status(200).send({ newestArticles, originalCount, user, userSubList });
    return;
  })
);
router.get(
  "/getById",
  wrap(async function(req, res) {
    let list = fs.read("articles");
    let userId = req.query.id;
    let userList = fs.read("userList");
    let user = _.find(userList, d => {
      return +d.id === +userId;
    });
    let userArticleList = _.filter(list, d => {
      return d.creatorId === userId;
    });

    let newestArticles = _.chain(userArticleList)
      .sortBy("createTime")
      .reverse()
      .filter((d, i) => {
        return i < 5;
      })
      .value();
    let originalCount = userArticleList.filter(d => {
      return +d.articleType === YUAN_CHUANG;
    }).length;
    res.status(200).send({ newestArticles, originalCount, user });
    return;
  })
);

router.post(
  "/follow",
  wrap(async function(req, res) {
    fs.insert("subscribe", req.body);
    res.sendStatus(200);
    return;
  })
);
router.post(
  "/unfollow",
  wrap(async function(req, res) {
    let id = req.body.id;
    let item = fs.get("subscribe", id);
    item["isDeleted"] = true;
    fs.update("subscribe", item, list => {
      //TODO::
    });
    res.sendStatus(200);
    return;
  })
);

module.exports = exports = router;
