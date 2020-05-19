const http = require('http');
// const io = ;
const {socket_init} = require('./server/socket')
const {listFiles,getFileMethods} = require('./common_funcs/fsactions')

const exp = {
  socket_init,
  listFiles,
  getFileMethods
};

/**
 * @param {string} path path of folder to walk
 * @param {object} options options for server
 * @param {object} options.server  server to attach socket.io to 
 * @param {string} options.namespace name of the namespace
 * @param {object} options.guard guard object|function for the app
 * @param {function} options.guard.getUser ({string} token,socket) function to retrieve user from datasource 
 * @param {function} options.guard.safeUser  ({object} user,{object} socket) function to filter user to pass to front app
 * @param {function} options.guard.pathGuard ({sting} path of method, {object} user,{object} socket)  function to validate path for user
 * @param {RegExp} options.ignore to ignore files with format
 * @returns {object} server object to start listening 
 */
exp.startSocketServer = function(path,options={}){
  let server = (options.server || http.createServer());
  let io = require('socket.io').listen(server);
  let files = listFiles(path,{format:"js",ignore:options.ignore});
  
  socket_init(io,appmethods,options.guard,options.namespace);
  return server;

}
module.exports= exp;


// console.log(listFiles(__dirname,{ignore: /^(_|\.|node_module)/,format:"js"}));