var io = require("socket.io-client");
import serverconfig from "../config/index";
var reqId = 1;
var socket;

var socketreconnect = function socketreconnect() {
  if (socket) {
    socket.disconnect();
    socket.io.opts.query = {
      api_token: window.localStorage.getItem("api_token") || null,
    };
    socket.connect();
    return;
  }
  socket = io.connect(serverconfig.socket.url + serverconfig.socket.namespace, {
    upgrade: false,
    transports: ["websocket"],
    reconnect: true,
    query: { api_token: window.localStorage.getItem("api_token") || null },
  });
  socket.on("connect", function () {
    console.log("socket connected to:", serverconfig.socket.url);
  });

  socket.on("reconnect", function () {});
  socket.on("disconnect", function () {});
  socket.on("force_reconnect", socketreconnect);
  return socket;
};

socketreconnect();

var socketcall = async (event, data = {}, options = {}) => {
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
          resolve(await socketcall(event, data, { ...options, reqId })),
        1000
      );
    }
  });
};

export default {
  socket,
  socketcall,
  socketreconnect,
};
