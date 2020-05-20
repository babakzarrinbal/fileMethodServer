const exp = {};

/**
 * initating filemethod to event socket server
 * @param {object} io instance of socket.io
 * @param {[object]} appmethods object of paths and methods
 * @param {string} appmethods[].path path of method
 * @param {function} appmethods[].method method to be run on path
 * @param {object} app_guard guard to validate user and access to paths
 * @param {function} app_guard.getUser get user from data source ({string} token )
 * @param {function} app_guard.pathGuard guard to validate user and access to paths ({string} path , {object} user)
 * @param {function} app_guard.safeUser returning safe user to pass to front app ( {object} user)
 * @param {string} nameSpace option for filemethod procedure
 */
exp.socket_init = function (io, appmethods, app_guard,nameSpace) {
  app_guard = app_guard ||{};
  nameSpace= nameSpace || "socket" ;
  //setting namespace of socket
  nameSpace = nameSpace.slice(0, 1) == "/" ? nameSpace.slice(1) : nameSpace;

  io.of("/" + nameSpace).on("connection", async function (socket) {
    try {
      await setlisteners(
        nameSpace,
        socket,
        appmethods,
        app_guard,
        (socket.request._query || {}).api_token
      );
      let rebuild_socket = async function (usertoken) {
        await setlisteners(
          nameSpace,
          socket,
          appmethods,
          app_guard,
          usertoken || ""
        );
        let result_user = null;
        if (app_guard.safeUser && socket.thisUser) {
          result_user = await app_guard.safeUser(socket.thisUser,socket);
        }
        socket.emit("socket_rebuild", result_user);
      };
      socket.on("socket_rebuild", async (data) =>
        rebuild_socket((data || {}).token)
      );
    } catch (e) {
      console.log("Error in /sockets/driver.js---------->>>>", e);
    }
  });
  return Object.keys(io.nsps);
};

/**
 * method to initialize or reset the socket connection
 * @param {string} ns namespace of socket or app name ( for socket room name prefix)
 * @param {object} socket socket object
 * @param {[object]} appmethods object of paths and methods
 * @param {string} appmethods[].path path of method
 * @param {function} appmethods[].method method to be run on path
 * @param {object} app_guard guard for validation user and paths
 * @param {object} app_guard.getUser method to get user from database ( {string} token)  
 * @param {object} app_guard.pathGuard method to validate user access to path ({string} path , {object} user)
 * @param {string} token token to get and validate user
 */
let setlisteners = async function setlisteners(
  ns,
  socket,
  appmethods,
  app_guard,
  token
) {
  let prevuser_id = socket.thisUser ? socket.thisUser._id.toString() : null;
  socket.thisUser = (app_guard || {}).getUser
    ? await app_guard.getUser(token,socket)
    : null;
  // leave user private room if no user exists or user changed
  if (
    prevuser_id &&
    (!socket.thisUser || socket.thisUser._id.toString() != prevuser_id)
  )
    socket.leave(ns + ":" + prevuser_id);
  // join user private room
  if (socket.thisUser) socket.join(ns + ":" + socket.thisUser._id.toString());
  appmethods.forEach(async (am) => {
    socket.removeAllListeners(am.path);
    if (
      (app_guard || {}).pathGuard
        ? await app_guard.pathGuard(am.path, socket.thisUser)
        : true
    ) {
      socket.on(am.path, async function (data = {}) {
        let result, error;
        try {
          result = await am.method(data.data, socket);
        } catch (e) {
          error = e;
        }
        socket.emit("result_" + (data.reqId || "") + ":" + am.path, {
          data: result
            ? typeof result != "object"
              ? { message: result }
              : result
            : null,
          error: error
            ? typeof error == "string"
              ? { message: error }
              : { message: "Server Error!!!" }
            : null,
        });
      });
    } else {
      socket.on(am.path, async function (data = {}) {
        socket.emit("result_" + (data.reqId || "") + ":" + am.path, {
          error: "not Autherized",
          data: null,
        });
      });
    }
  });

  return;
};

module.exports = exp;