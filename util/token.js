var crypto =require("crypto");
const _SECRET = "stevejialovezsj";
var token = {
    createToken: function(obj, timeout){
        var info = {
            data: obj,
            created: parseInt(Date.now/1000),
            exp: parseInt(timeout) || 10
        };

        //payload信息
        var base64Str = Buffer.from(JSON.stringify(info), "utf8").toString("base64");

        //添加签名，防篡改
        var hash = crypto.createHmac("sha256", _SECRET);
        hash.update(base64Str);
        var signature = hash.digest("base64");
        return base64Str + "." + signature;
    }, 
    decodeToken: function(token){
        var decArr = token.split(".");
        if(decArr.length < 2) {
            //token不合法
            return false;
        }
        var payload = {};
        //讲payload json字符解析
        try {
            payload=JSON.parse(Buffer.from(decArr[0], "base64").toString("utf8"));
        } catch(e) {
            return false;
        }

        //校验签名
        var hash = crypto.createHmac("sha256", _SECRET);
        hash.update(decArr[0]);
        var checkSignature = hash.digest("base64");
        return {
            payload: payload,
            signature: decArr[1],
            checkSignature: checkSignature
        }
    },
    checkToken: function(token) {
        token = token || "";
        var resDecode = this.decodeToken(token);
        if(!resDecode){
            return false;
        }
        //是否过期
        var now = parseInt(Date.now/1000);
        var tokenCreated = parseInt(resDecode.payload.created);
        var expState = (now - tokenCreated) > resDecode.payload.exp ? false : true;
        if(resDecode.checkSignature === resDecode.signature && expState){
            return true;
        }
        return false;
    }
};
module.exports = exports = token;