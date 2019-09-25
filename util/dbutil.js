const models = require('../db/db');
const returnInfo = {
    data: null,
    message: null
}
var dbUtil = {
    find: async function(collection, queryParams){
        let list = [];
        list = await models[collection].find(queryParams).exec();
        return list;
    },
    save: async function(collection, data){
        var newItem = new models[collection](data);
        await newItem.save((err,data) => {
            if (err) {
                returnInfo.message = err; 
            } 
        });
        return returnInfo;
    },
    findOne: async function(collection, queryParams){
        let data = await models[collection].findOne(queryParams).exec();
        return data;
    }
};
module.exports = exports = dbUtil;