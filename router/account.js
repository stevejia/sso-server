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

const classifiesApi = require("../ba/classifies");
const commentApi = require("../ba/comments");
const accountApi = require("../ba/account");

const articleApi = require("../ba/articles");
const subscribeApi = require("../ba/subscribe");
router.post(
  "/login",
  wrap(async function(req, res) {
    let user = req.body;
    let userForLogin = await accountApi.login(user);
    let token = tokenGen.createToken({
      userName: userForLogin.name,
      userId: userForLogin.id
    });
    localStorage.setItem(`${userForLogin.id}`, token);
    res.send({ token, userInfo: userForLogin });
  })
);
router.post(
  "/register",
  wrap(async function(req, res) {
    let user = req.body;
    await accountApi.register(user);
    res.send();
    return;
  })
);
router.get(
  "/check",
  wrap(async function(req, res) {
    var token = localStorage.getItem("admin_token");
    if (!token) {
      res.status(401).send();
      return;
    }
    var data = await http.get("account/CheckLogin", { oldToken: token });
    var newToken = data.Data.newToken;
    localStorage.setItem("admin_token", newToken);
    res.send();
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
    let articleId = req.query.id;
    let result = await getUserBlogInfo(articleId);
    res.status(200).send(result);
    return;
  })
);
router.get(
  "/getById",
  wrap(async function(req, res) {
    let userId = req.query.id;
    let result = await getUserBlogInfo(userId, false);
    res.status(200).send(result);
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

const getUserBlogInfo = async (id, isArticle = true) => {
  let userId = id;
  if (isArticle) {
    let article = await articleApi.get(id);
    userId = article.creatorId;
  }
  let user = await accountApi.get(userId);

  let userArticleList = await articleApi.list({ creatorId: userId });
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

  let userSubList = await subscribeApi.list({ userId });

  let userClassifies = await classifiesApi.list({ userId: userId });

  _.forEach(userClassifies, d => {
    let articles = _.filter(userArticleList, r => {
      return (
        _.filter(r.classifies, k => {
          return k.id == d.id;
        }).length > 0
      );
    });
    d["articleCount"] = articles.length;
  });

  let userComments = await commentApi.query({ commentUserId: userId });
  let newestComments = _.chain(userComments)
    .filter((d, i) => {
      return i < 5;
    })
    .sortBy("createTime")
    .reverse()
    .map(d => {
      let article = _.find(userArticleList, r => {
        return r.id == d.articleId;
      });
      return { ...d, ...{ title: article.title } };
    })
    .value();

  return {
    newestArticles,
    originalCount,
    user,
    userSubList,
    userClassifies,
    newestComments
  };
};

module.exports = exports = router;
