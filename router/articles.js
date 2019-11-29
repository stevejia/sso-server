const express = require("express");
const router = express.Router();
const wrap = require("../util/asyncErrorHandler");
const fs = require("../util/fsUtil");
const _ = require("lodash");

const articlesApi = require("../ba/articles");
const commentsApi = require("../ba/comments");
const classifiesApi = require("../ba/classifies");
router.post(
  "/save",
  wrap(async function(req, res) {
    let data = req.body;

    let classifies = data.classifies;
    let userClassifies = await classifiesApi.list({ userId: data.creatorId });

    let toAddClassifies = _.filter(classifies, d => {
      return !d.id;
    });
    let noNeedAddClassifies = _.filter(classifies, d => {
      return !!d.id;
    });

    toAddClassifies = await classifiesApi.create(toAddClassifies);

    classifies = _.sortBy([...toAddClassifies, ...noNeedAddClassifies], "id");
    data.classifies = classifies;
    if (!!data.id) {
      await articlesApi.update(data);
    } else {
      await articlesApi.create(data);
    }

    res.status(200).send();
  })
);
router.get(
  "/list",
  wrap(async function(req, res) {
    let query = req.query;
    let list = await articlesApi.list(query);
    res.status(200).send({ list });
    return;
  })
);
router.get(
  "/get",
  wrap(async function(req, res) {
    let item = await articlesApi.get(req.query.id);
    res.status(200).send({ item });
    return;
  })
);

router.post(
  "/savecomment",
  wrap(async function(req, res) {
    let comment = req.body;
    commentsApi.create(comment);
    res.status(200).send();
    return;
  })
);

router.get(
  "/listcomments",
  wrap(async function(req, res) {
    let id = req.query.id;
    let list = await commentsApi.list(id);
    res.status(200).send({ list });
    return;
  })
);
module.exports = exports = router;
