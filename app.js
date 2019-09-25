const bodyParser = require("body-parser");
const express = require("express");
const api = require("./api");
const cors = require("cors");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//use cors dependency and use(*, fun)method
app.options("*", cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Content-Length, Authorization, Accept,X-Requested-With"
  );
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  //是否需要验证 登录 注册 相关的请求不需要验证。
  next();
});
//api来源于 router
app.use(api);
app.listen(8088);
