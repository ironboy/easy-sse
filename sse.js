export default class SSE {

  constructor(endpoint) {
    this.listeners = [];
    this.restart(endpoint);
  }

  restart(endPoint) {
    this.endPointCalc(endPoint);
    if(this.longpolling){}
    this.stream && this.stream.close();
    this.stream = new EventSource(this.endPoint);
    this.stream.addEventListener('error', () => {
      this.addListeners();
    });
  }

  listen(eventType, callback) {
    this.listeners.push({ eventType, callback });
    this.addListeners();
    return this.listeners.length - 1;
  }

  unlisten(listenerIndex) {
    this.listeners.splice(listenerIndex, 1);
  }

  addListeners() {
    this.restart();
    [...new Set(this.listeners.map(x => x.eventType))].forEach(x => {
      this.stream.addEventListener(x, (event) => {
        let data = event.data;
        try { data = JSON.parse(data) } catch (e) { }
        this.listeners
          .filter(x => x.eventType === event.type)
          .forEach(x => x.callback(data));
      });
    });
  }

  browserId() {
    let s = window.localStorage;
    if (!s) { return Math.random(); }
    s.sseBrowserId = s.sseBrowserId || Math.random();
    return s.sseBrowserId;
  }

  endPointCalc(endPoint){
    this.endPoint = endPoint || this.endPoint || '/api/sse';
    if (!this.endPoint.includes('browserId=')) {
      this.endPoint += (this.endPoint.includes('?') ? '&' : '?')
        + 'browserId=' + this.browserId();
    }
  }

}