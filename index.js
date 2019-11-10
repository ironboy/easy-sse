const fs = require('fs');
const path = require('path');

function terminateUrlWithSlash(url) {
  let p = url.split('?');
  p[0] += p[0].slice(-1) === '/' ? '' : '/';
  return p.join('?');
}

module.exports = (settings = {}) => {
  let mem = [];
  let endpoint = settings.endpoint || '/sse';
  let script = settings.script || '/sse.js';
  let scriptSource = fs.readFileSync(path.join(__dirname, './sse.js'), 'utf-8');
  endpoint = terminateUrlWithSlash(endpoint);
  script = terminateUrlWithSlash(script);
  scriptSource = scriptSource.split('export default ')[1];

  function enforceOneSessionPerBrowser(newReq, newRes) {
    mem.forEach(({ req, res }) => {
      if (!req.session) { return; }
      if (
        req.query.browserId === newReq.query.browserId &&
        req.session.id !== newReq.session.id
      ) {
        res.end();
      }
    });
  }

  return {

    SSE(req, res, next) {
      let url = terminateUrlWithSlash(req.url);
      if(url === script){
        res.set({
          'Content-Type': 'javascript/application',
        });
        res.send(scriptSource);
        return;
      }
      if (url.indexOf(endpoint) !== 0) { next(); return; }
      enforceOneSessionPerBrowser(req, res);
      res.set({
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      });
      let item = { req, res };
      mem.push(item);
      req.on('close', () => {
        let index = mem.indexOf(item);
        index >= 0 && mem.splice(index, 1);
      });
    },

    send(to, eventType, data, filter = (() => true)) {
      if (typeof to !== 'function' && to !== 'all') {
        throw (new Error('Send to "all" or a filter function filtering on req'));
      }
      if (typeof to !== 'function') {
        to = () => true;
      }
      mem.filter(({ req }) => to(req)).forEach(item =>
        item.res.write(
          `event: ${eventType}\n` +
          `data: ${JSON.stringify(data)}\n\n`
        )
      );
    },

    openConnections() { return mem.length; },

    openSessions() {
      let ids = {};
      mem.forEach(x => x.req.session && (ids[x.req.session.id] = 1));
      return Object.keys(ids).length;
    }
  }
}