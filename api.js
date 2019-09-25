"use strict";
const express = require("express");
const router = express.Router();
const account = require("./router/account");

router.use("/api/account", account);
module.exports = router;
