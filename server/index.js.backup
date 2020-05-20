var exp = {};
const path = require("path"),
  fs = require("fs");

/**
 * listing methods base on filepath/method
 * @param {string} folderpath main folder path
 * @param {object} options options for listing methods
 * @param {RegExp} options.ignore regexpression to ignore file and folders defult=> ^(_|\.)
 * @param {RegExp} options.accept regexpression to accept file and folders defult=>null (all)
 * @param {string} options.rootpath root path for creating url of method => default =>""
 * @param {boolean} options.recursive to list subfolders also default=>true
 */
var listmethods = function listmethods(folderpath, options = {}) {
  options.rootpath = options.rootpath || "";
  options.ignore = options.ignore || /^(_|\.)/;
  options.recursive = options.recursive != undefined ? options.recursive : true;
  if (!(options.ignore instanceof RegExp))
    throw new Error("wrong input type: expected RegExp");
  if (options.accept && !(options.accept instanceof RegExp))
    throw new Error("wrong input type: expected RegExp");
  let filemethods = [];
  let files = fs.readdirSync(path.resolve(folderpath));
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (
      file.match(options.ignore) ||
      (options.accept && !file.match(options.ignore))
    )
      continue;
    let address = path.resolve(folderpath, file);
    if (!fs.statSync(address).isDirectory()) {
      let cname = file.split(".");
      cname.pop();
      let filepath = path.join(options.rootpath, cname.join(""));
      let controller = require(address);
      let controllerkeys = Object.keys(
        typeof controller == "object" ? controller : {}
      );
      if (!controllerkeys.length) continue;
      controllerkeys.forEach(name => {
        filemethods.push({
          path: path.join(filepath, name).replace(/\\/g, "/"),
          name,
          method: controller[name]
        });
      });
    } else if (options.recursive) {
      let submethods = listmethods(address, {
        rootpath: path.join(options.rootpath, file),
        ignore: options.ignore,
        accept: options.accept || null
      });
      filemethods = [...filemethods, ...submethods];
    }
  }
  return filemethods;
};

/**
 * initating filemethod to event socket server
 * @param {object} io instance of socket.io
 * @param {string} appsfolderpath path of dynamic apps first folder is namespace
 * @param {object} options option for filemethod procedure
 * @param {RegExp} options.accept accept regex for folder/file name false for all
 * @param {RegExp} options.ignore ignore regex for folder/file name default=> /^(_|\.)/
 * @param {RegExp} options.nsaccept accept regex for namespace name false for all
 * @param {RegExp} options.nsignore accept regex for namespace name default=> /^(_|\.)/
 */
exp.socket_init = function(io, appsfolderpath, options = {}) {
  options.nsignore = options.nsignore || /^(_|\.)/;
  let namespaces = fs
    .readdirSync(appsfolderpath)
    .map(name => {
      let address = path.resolve(appsfolderpath, name);
      if (
        !fs.statSync(address).isDirectory() ||
        name.match(options.nsignore) ||
        (options.nsaccept && !name.match(options.nsaccept))
      )
        return false;
      return { name, address };
    })
    .filter(a => a);

  let setlisteners = async function(app, socket, appmethods, app_guard, token) {
    let prevuser_id = socket.thisUser ? socket.thisUser._id.toString() : null;
    socket.thisUser = (app_guard || {}).getUser
      ? await app_guard.getUser(token)
      : null;
    // leave user private room if no user exists or user changed
    if (
      prevuser_id &&
      (!socket.thisUser || socket.thisUser._id.toString() != prevuser_id)
    )
      socket.leave(app.name + ":" + prevuser_id);
    // join user private room
    if (socket.thisUser)
      socket.join(app.name + ":" + socket.thisUser._id.toString());

    //remove all listeners
    appmethods.forEach(async am => {
      socket.removeAllListeners(am.path);
      if (
        (app_guard || {}).socketGuard
          ? await app_guard.socketGuard(am.path, socket.thisUser)
          : true
      ) {
        socket.on(am.path, async function(data = {}) {
          let result, error;
          try {
            result = await am.method(data, socket);
          } catch (e) {
            error = e;
          }
          socket.emit("result_" + (data.reqId || "") + ":" + am.path, {
            data: result
              ? typeof result == "string"
                ? { message: result }
                : result
              : null,
            error: error
              ? typeof error == "string"
                ? { message: error }
                : { message: "Server Error!!!" }
              : null
          });
        });
      } else {
        socket.on(am.path, async function(data = {}) {
          socket.emit("result_" + (data.reqId || "") + ":" + am.path, {
            error: "not Autherized",
            data: null
          });
        });
      }
    });

    return;
  };

  for (let i = 0; i < namespaces.length; i++) {
    let app = namespaces[i];
    let appmethods = listmethods(app.address, {
      accept: options.accept,
      ignore: options.ignore
    });

    let app_guard;
    try {
      app_guard = require(path.resolve(app.address, "_guard.js"));
    } catch (e) {
      app_guard = null;
    }

    io.of(app.name).on("connection", async function(socket) {
      try {
        let token = (socket.request._query || {}).api_token;
        socket.join(app.name);
        await setlisteners(app, socket, appmethods, app_guard, token);
        let rebuild_socket = async function(usertoken) {
          await setlisteners(
            app,
            socket,
            appmethods,
            app_guard,
            usertoken || ""
          );
          let result_user = null;
          if ((app_guard || {}).safe_user && socket.thisUser) {
            result_user = await app_guard.safe_user(socket);
          }
          socket.emit("socket_rebuild", result_user);
        };
        socket.on("socket_rebuild", data => rebuild_socket((data || {}).token));
      } catch (e) {
        console.log("Error in /sockets/driver.js---------->>>>", e);
      }
    });
  }
  return Object.keys(io.nsps);
};

/**
 * initating filemethod to http api calls
 * @param {object} app instance of express
 * @param {string} appsfolderpath path of dynamic apps first folder is namespace
 * @param {object} options option for filemethod procedure
 * @param {RegExp} options.accept accept regex for folder/file name false for all
 * @param {RegExp} options.ignore ignore regex for folder/file name default=> /^(_|\.)/
 * @param {RegExp} options.nsaccept accept regex for firstfolder name false for all
 * @param {RegExp} options.nsignore accept regex for firstfolder name default=> /^(_|\.)/
 * @param {string} options.verb http call verbs (get|post|put|patch|delete|all)
 */
exp.http_init = function(app, appsfolderpath, options = {}) {
  options.nsignore = options.nsignore || /^(_|\.)/;
  options.verb = options.verb || "all";
  let namespaces = fs
    .readdirSync(appsfolderpath)
    .map(name => {
      let address = path.resolve(appsfolderpath, name);
      if (
        !fs.statSync(address).isDirectory() ||
        name.match(options.nsignore) ||
        (options.nsaccept && !name.match(options.nsaccept))
      )
        return false;
      return { name, address };
    })
    .filter(a => a);
  for (let i = 0; i < namespaces.length; i++) {
    let appfol = namespaces[i];
    let appmethods = listmethods(appfol.address, {
      accept: options.accept,
      ignore: options.ignore
    });
    let app_guard;

    try {
      app_guard = require(path.resolve(appfol.address, "_guard.js"));
    } catch (e) {
      app_guard = null;
    }
    appmethods.forEach(am => {
      let routefunc = async function(req, res) {
        let result, error;
        try {
          result = await am.method({ ...req.query, ...req.body }, req);
        } catch (e) {
          error = e;
        }
        return res.send({
          data: result
            ? typeof result == "string"
              ? { message: result }
              : result
            : null,
          error: error
            ? typeof error == "string"
              ? { message: error }
              : { message: "Server Error!!!" }
            : null
        });
      };
      if ((app_guard || {}).httpGuard) {
        app[options.verb](
          appfol.name + "/" + am.path,
          app_guard.httpGuard,
          routefunc
        );
      } else {
        app[options.verb]("/" + appfol.name + "/" + am.path, routefunc);
      }
    });
  }
};

module.exports = exp;
