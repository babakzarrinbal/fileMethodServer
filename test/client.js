let so = require('../client/socket');
so.connect("http://localhost:3000/socket").then(s=>{
  // console.log('connected');
  setInterval(() => {
    console.log('emited');
    so.call("/test/test",{a:1}).then((r)=>console.log(1,r))
    so.call("/test/test/test",{a:2}).then((r)=>console.log(2,r))
    
  }, 10000);

});