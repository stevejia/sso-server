import _ from "lodash";
import moment from "moment";
import { api } from "@/api/api";
import store from "@/store";
const utilMethods = {
  //textCode
  showText(arr, value, textCode = "text", valueCode = "value") {
    let text = value;
    let item = _.find(arr, d => {
      return d[valueCode] === +value;
    });
    if (item) {
      text = item[textCode];
    }
    return text;
  },
  formatDate(dateString, format = "YYYY-MM-DD") {
    if (dateString) {
      let m = moment(dateString);
      if (m.isValid()) {
        return m.format(format);
      } else {
        return dateString;
      }
    } else {
      return "";
    }
  },
  formatNum(amount, thousands = ",") {
    amount = amount || 0;
    let numAmount = Number(amount).toString();
    // let fixedAmount = numAmount.toFixed(scale);
    let value2Array = numAmount.split(".");
    if (value2Array.length >= 1) {
      let intPart = value2Array[0];
      let intPartFormat = intPart
        .toString()
        .replace(/(\d)(?=(?:\d{3})+$)/g, "$1" + thousands);
      if (value2Array.length === 2) {
        let floatPart = value2Array[1];
        return intPartFormat + "." + floatPart;
      } else if (value2Array.length === 1) {
        return intPartFormat;
      }
    }
  },
  hasPermission(privilege) {
    if (!privilege || privilege == 0) {
      return true;
    }
    let permissions = store.state.userPermissions;
    if (!permissions || !permissions.length) {
      return false;
    }
    // permissions = permissions.split(',') || []
    return permissions.some(value => value == privilege);
  },
  param(obj) {
    let paramList = [];
    for (var key in obj) {
      let p = `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
      paramList.push(p);
    }
    if (!paramList.length) {
      return "";
    } else {
      return `?${paramList.join("&")}`;
    }
  },
  cleanEmpty(o) {
    if (o === null || o === undefined || _.isFunction(o) || o === "") {
      return o;
    } else {
      let obj = _.clone(o);
      if (
        _.isDate(obj) ||
        _.isBoolean(obj) ||
        _.isNumber(obj) ||
        _.isString(obj)
      ) {
        return;
      } else if (_.isArrayLike(obj)) {
        for (var i = 0; i < obj.length; i++) {
          this.cleanEmpty(obj[i]);
        }
      } else if (_.isObject(obj)) {
        for (var prop in obj) {
          var v = obj[prop];
          this.cleanEmpty(v);

          if (
            v === null ||
            v === undefined ||
            _.isFunction(v) ||
            v === "" ||
            (!(
              _.isDate(v) ||
              _.isBoolean(v) ||
              _.isNumber(v) ||
              _.isString(v)
            ) &&
              (_.isArrayLike(v) || _.isObject(v)) &&
              _.isEmpty(v))
          ) {
            delete obj[prop];
          }
        }
      }
      return obj;
    }
  },
  /**
   ** 加
   **/
  add(arg1, ...arg2) {
    return;

    var r1, r2, m, c;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    c = Math.abs(r1 - r2);
    m = Math.pow(10, Math.max(r1, r2));
    if (c > 0) {
      var cm = Math.pow(10, c);
      if (r1 > r2) {
        arg1 = Number(arg1.toString().replace(".", ""));
        arg2 = Number(arg2.toString().replace(".", "")) * cm;
      } else {
        arg1 = Number(arg1.toString().replace(".", "")) * cm;
        arg2 = Number(arg2.toString().replace(".", ""));
      }
    } else {
      arg1 = Number(arg1.toString().replace(".", ""));
      arg2 = Number(arg2.toString().replace(".", ""));
    }
    return (arg1 + arg2) / m;
  },
  /**
   ** 减
   **/
  subtract(arg1, ...arg2) {
    return;
    var r1, r2, m, n;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
    n = r1 >= r2 ? r1 : r2;
    return Number(((arg1 * m - arg2 * m) / m).toFixed(n));
  },
  multiply(arg1, ...arg2) {
    return;
    var m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString();
    try {
      m += s1.split(".")[1].length;
    } catch (e) {}
    try {
      m += s2.split(".")[1].length;
    } catch (e) {}
    return (
      (Number(s1.replace(".", "")) * Number(s2.replace(".", ""))) /
      Math.pow(10, m)
    );
  },
  divide(arg1, ...arg2) {
    return;
    var t1 = 0,
      t2 = 0,
      r1,
      r2;
    try {
      t1 = arg1.toString().split(".")[1].length;
    } catch (e) {}
    try {
      t2 = arg2.toString().split(".")[1].length;
    } catch (e) {}
    r1 = Number(arg1.toString().replace(".", ""));
    r2 = Number(arg2.toString().replace(".", ""));
    return (r1 / r2) * Math.pow(10, t2 - t1);
  },
  formatAmount(number, options) {
    return accounting.formatMoney(
      number,
      Object.assign(
        {
          symbol: "",
          precision: 2,
          format: {
            pos: "%s %v",
            neg: "%s (%v)",
            zero: "%s  --"
          }
        },
        options || {}
      )
    );
  },
  numberToBoolean(num) {
    if (typeof num === "number") {
      return num === 1;
    }
    return num;
  },
  booleanToNumber(bo) {
    if (typeof bo === "boolean") {
      return bo ? 1 : 0;
    }
    return bo;
  }
};
export const utils = utilMethods;
