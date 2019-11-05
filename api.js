"use strict";
const express = require("express");
const router = express.Router();
const account = require("./router/account");
const system = require("./router/common");
const articles = require("./router/articles");
router.use("/api/account", account);
router.use("/api/system", system);
router.use("/api/articles", articles);

module.exports = router;
