// const {socket_init} = require('../server/socket');
const {startSocketServer} = require("../index")
const path = require('path')
let {server,io} = startSocketServer(path.join(__dirname,"test"));
server.listen(3000,()=>console.log('server started at localhost:3000'));