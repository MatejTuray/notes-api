const env = process.env.NODE_ENV || "dev";
if (env === "dev") {
  process.env.PORT = 5000;
  process.env.MONGODB_URI =
    "mongodb://admin:admin1@ds029454.mlab.com:29454/notes-api";
  process.env.REDIS_PORT = "6379";
  process.env.REDIS_HOST = "127.0.0.1";
  process.env.REDIS_PASSWORD = "test";
  process.env.REDISCLOUD_URL = "127.0.0.1:6379";
} else if (env === "test") {
  process.env.PORT = 5000;
  process.env.MONGODB_URI =
    "mongodb://admin:admin1@ds029454.mlab.com:29454/notes-api";
  process.env.REDIS_PORT = "6379";
  process.env.REDIS_HOST = "127.0.0.1";
  process.env.REDIS_PASSWORD = "test";
  process.env.REDISCLOUD_URL = "127.0.0.1:6379";
}
module.exports = { env };
