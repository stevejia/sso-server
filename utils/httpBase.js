const axios = require("axios");
const ajax = (method, isDownload = false) => {
  return (url, params, needLoading = true, fileName, extensions = "xls") => {
    return new Promise((resolve, reject) => {
      //   needLoading && store.commit("showLoading");
      let config = {
        method: method,
        url: `http://localhost:55713/${url}`
      };
      if (method === "post") {
        config["data"] = params;
      } else {
        params = formatParams(params);
        config["params"] = params;
        if (isDownload) {
          // download 模式下 responseType: 'blob'
          config["responseType"] = "blob";
        }
      }
      axios(config)
        .then(response => {
          if (!isDownload) {
            if (response && response.data) {
              if (
                response.data.status === false ||
                response.data.Status === false
              ) {
                reject(response.data);
                // needLoading && store.commit("hideLoading");
                return;
              }
            }
            resolve(response.data);
            // needLoading && store.commit("hideLoading");
          } else {
            const blob = new Blob([response.data], {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
            });
            const downloadElement = document.createElement("a");
            const href = window.URL.createObjectURL(blob);
            downloadElement.href = href;
            downloadElement.download = `${fileName}.${extensions}`;
            document.body.appendChild(downloadElement);
            downloadElement.click();
            document.body.removeChild(downloadElement); // 下载完成移除元素
            window.URL.revokeObjectURL(href); // 释放掉blob对象
          }
        })
        .catch(error => {
          error.message = "系统错误，请联系管理员！";
          reject(error);
        });
    });
  };
};

function formatParams(params) {
  let _params = { ...params };
  if (params && params.pagination) {
    _params = {
      ..._params,
      "pagination.currentPage": _params.pagination.currentPage,
      "pagination.pageSize": _params.pagination.pageSize
    };
    delete _params.pagination;
  }
  return _params;
}
const showMessage = message => {
  // alert("message");
  // Message.destroy();
  // Message.error({
  //     content: message,
  //     duration: 0,
  //     closable: true,
  //     onClose: () => {
  //         Message.destroy();
  //     }
  // });
};
module.exports = ajax;
