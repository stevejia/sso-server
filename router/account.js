const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./auth");
const http = require("../utils/http");
router.post(
  "/login",
  wrap(async function(req, res) {
    let data = await http.post("sso/login", req.body);
    console.log(data);
    localStorage.setItem("admin_token", data.token);
    res.send(data);
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
    var data = await http.get("sso/check", { oldToken: token });
    var newToken = data.Data.newToken;
    localStorage.setItem("admin_token", newToken);
    res.send(data);
    return;
  })
);
router.post(
  "/logout",
  wrap(async function(req, res) {
    localStorage.removeItem("admin_token");
    res.sendStatus(401);
    return;
  })
);
module.exports = exports = router;