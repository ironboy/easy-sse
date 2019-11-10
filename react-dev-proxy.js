const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();

module.exports = ({ route, target }) => {
  return app => {
    app.use((req, res, next) => {
      if (req.url.indexOf(route) !== 0) { next(); return; }
      proxy.web(req, res, { target });
    });
  }
}

/*
Usage in create-react-app
Add a file named setupProxy.js in the src-folder
with the following contents

const proxy = require('easy-server-sent-events/react-dev-proxy');
module.exports = proxy({
  route: '/api/',
  target: 'http://localhost:4000'
});
*/