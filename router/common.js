const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const fs = require("../util/fsUtil");
router.get(
  "/getcommondata",
  wrap(async function(req, res) {
    // let filePath = "./data/blogTypes.json";
    // let exists = fs.existsSync(filePath);
    // let blogTypes = [];
    // if (exists) {
    //   blogTypes = JSON.parse(fs.readFileSync(filePath));
    // }
    let blogTypes = fs.read("blogTypes");

    let articleTypes = fs.read("articleTypes");

    // let articleTypesPath = "./data/articleTypes.json";
    // exists = fs.existsSync(articleTypesPath);
    // let articleTypes = [];
    // if (exists) {
    //   articleTypes = JSON.parse(fs.readFileSync(articleTypesPath));
    // }
    res.status(200).send({ blogTypes, articleTypes });
    return;
  })
);
module.exports = exports = router;
