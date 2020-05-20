

give folder to the startSocketServer 
first level folders considered as namespace
inside first level folder _guard.js introduces the gaurd methods
all js files inside is called with their address

# file-method-server
    create dynamic socket server based on folder/methods

## Installation

```bash
npm i file-method-server
```

## Usage
    const {startSocketServer} = require("file-method-server")
    const path = require('path')
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
    * @param {boolean} options.hidelogs show or hide logs
    * @returns {object} server object to start listening
    */
    let {server,io} = startSocketServer(path.join(__dirname,"test"),);
    server.listen(3000,()=>console.log('server started at localhost:3000'));


```javaScript
    

```



