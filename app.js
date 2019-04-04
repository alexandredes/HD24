const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());
const path = require('path');
var pcsc = require('pcsclite');

var pcsc = pcsc();

const router = express.Router();


const http = require('http').Server(app);
const io = require('socket.io')(http);


pcsc.on('reader', function(reader) {
    
    console.log('New reader detected', reader.name);
 
    reader.on('error', function(err) {
        console.log('Error(', this.name, '):', err.message);
    });
 
    reader.on('status', function(status) {
        console.log('Status(', this.name, '):', status);
        /* check what has changed */
        var changes = this.state ^ status.state;
        if (changes) {
            if ((changes & this.SCARD_STATE_EMPTY) && (status.state & this.SCARD_STATE_EMPTY)) {
                console.log("card removed");/* card removed */
                reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Disconnected');
                    }
                });
            } else if ((changes & this.SCARD_STATE_PRESENT) && (status.state & this.SCARD_STATE_PRESENT)) {
                console.log("card inserted");/* card inserted */
                reader.connect({ share_mode : this.SCARD_SHARE_SHARED }, function(err, protocol) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Protocol(', reader.name, '):', protocol);
                        reader.transmit(new Buffer([0x00, 0xB0, 0x00, 0x00, 0x20]), 40, protocol, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Data received', data);
                                alert(data);
                                reader.close();
                                pcsc.close();
                            }
                        });
                    }
                });
            }
        }
    });
 
    reader.on('end', function() {
        console.log('Reader',  this.name, 'removed');
    });
});
 
pcsc.on('error', function(err) {
    console.log('PCSC error', err.message);
    alert(err.message);
});

io.on('connection', function(socket){
  socket.on('product_update', function(data){
    io.emit('product_update', data);
  });
});

router.get('/',function(req,res){
  var productURL = 'https://6bfd57eed404cfcbfb7c7ca4bcd8a374:920c7c6f4b911fe9d9fddd2d1a6d00a6@hackdays24price.myshopify.com/admin/products/1565418225686.json';
  setTimeout(function() {
    request(productURL, function (error, response, body) {
      io.emit('initial_call', response);
    });
  }, 3000);
  res.sendFile(path.join(__dirname+'/index.html'));
});

router.get('/scan',function(req,res){
  res.sendFile(path.join(__dirname+'/scan.html'));
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
app.use("/public", express.static(__dirname + "/public"));

http.listen(process.env.PORT || 3000);

console.log('Running at Port 3000');