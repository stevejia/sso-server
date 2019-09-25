let baseUrl = "";
switch (process.env.NODE_ENV) {
  case "development":
    baseUrl = "http://localhost:55713";
    break;
  case "production":
    baseUrl = "http://localhost:55713";
    break;
  case "test":
    baseUrl = "http://localhost:55713";
    break;
}
module.exports = baseUrl;
