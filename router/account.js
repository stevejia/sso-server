const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./auth");
const http = require("../utils/http");
const fs = require("fs");
const _ = require("lodash");
const tokenGen = require("../util/token");
router.post(
  "/login",
  wrap(async function(req, res) {
    let exists = fs.existsSync("./data/userList.json");
    let userList = [];
    let user = req.body;
    if (exists) {
      userList = JSON.parse(fs.readFileSync("./data/userList.json"));
    }
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
    let exists = fs.existsSync("./data/userList.json");
    let userList = [];
    let user = req.body;
    if (!exists) {
      user["id"] = 1;
      userList.push(user);
    } else {
      userList = JSON.parse(fs.readFileSync("./data/userList.json"));
      let existUser = _.find(userList, function(d) {
        return d.name === user.name;
      });
      if (!!existUser) {
        res.status(500).send("用户名已存在");
        return;
      }
      user["id"] = userList.length + 1;
      userList.push(user);
    }
    fs.writeFileSync("./data/userList.json", JSON.stringify(userList));
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
module.exports = exports = router;
