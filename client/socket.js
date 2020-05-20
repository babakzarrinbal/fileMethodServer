var io = require("socket.io-client");

var reqId = 1;
var socket;

var connect = function connect(url,token=null) {
  return new Promise(resolve=>{

  
  if (socket) {
    socket.disconnect();
    socket.io.opts.query = {
      api_token: token,
    };
    socket.connect();
  }else{
    socket = io.connect(url, {
      upgrade: false,
      transports: ["websocket"],
      reconnect: true,
      query: { api_token: token },
    });

  }
  socket.on("connect", function () {
    console.log("socket connected to:", url);
    resolve(socket);
  });

  socket.on("reconnect", function () {});
  socket.on("disconnect", function () {});
  socket.on("force_reconnect", ()=>connect(url));
})
};

var call = async function call(event, data = {}, options = {}){
  options.timeout = options.timeout || 8000;
  reqId = reqId > 100000 ? 1 : reqId;
  reqId = options.reqId || reqId + 1;

  return new Promise(async (resolve) => {
    if (socket.connected) {
      socket.once("result_" + (reqId - 1) + ":" + event, resolve);
      socket.emit(event, { reqId: reqId - 1, data });
      setTimeout(() => {
        socket.removeListener("result_" + (reqId - 1) + ":" + event, resolve);
        return resolve({ error: "request timeout", data: null });
      }, options.timeout);
    } else if (options.persistance) {
      setTimeout(
        async () =>
          resolve(await call(event, data, { ...options, reqId })),
        1000
      );
    }
  });
};

module.exports =  {
  socket,
  call,
  connect,
};
