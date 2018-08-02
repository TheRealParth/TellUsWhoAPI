module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name       : "cooe-api",
      script     : "./bin/www",
      "node_args": ["--debug=7000", "ADDRESS=localhost", "PORT=8080", "--watch"],
      instances  : 4,
      exec_mode  : "cluster"
    }]
}
