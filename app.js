const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());
const path = require('path');
const router = express.Router();

const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', function(socket){
  socket.on('product_update', function(data){
    io.emit('product_update', data);
  });
});

router.get('/',function(req,res){
request('http://www.google.com', function (error, response, body) {
  io.emit('api', response);
});
  //'/admin/products/1931036426296/variants.json';
  res.sendFile(path.join(__dirname+'/index.html'));
  //__dirname : It will resolve to your project folder.
});

router.post('/product_update',function(req,res){
  io.emit('product_update', req.body);
  res.status(200);
  res.send();
});

router.post('/inventory_update',function(req,res){
  io.emit('inventory_update', req.body);
  res.status(200);
  res.send();
});

router.get('/sitemap',function(req,res){
  res.sendFile(path.join(__dirname+'/sitemap.html'));
});

app.post('messages', (req, res) => {
  var message = new Message(req.body);
  message.save((err) =>{
    if(err)
      sendStatus(500);
    io.emit('message', req.body);
    res.sendStatus(200);
  })
})

//add the router
app.use('/', router);

http.listen(process.env.PORT || 3000);

console.log('Running at Port 3000');