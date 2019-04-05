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





// PC/SC interface.
pcsc.on('reader', function(reader) {
 console.log('Reader detected:', reader);
 reader.on('error', function(err) {
   console.log('Error(', reader.name, '):', err.message);
 });
 reader.on('status', function(status) {
  console.log('Status(', reader.name, '):', status);
// Check changes.
var changes = this.state ^ status.state;
if (changes) {
// Card removed.
if ((changes & this.SCARD_STATE_EMPTY) && (status.state & this.SCARD_STATE_EMPTY)) {
  console.log('Status(', reader.name, '): Card removed');
  reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) {
    if (err) {
      console.log('Error(', reader.name, '):', err);
    }
    else {
      console.log('Status(', reader.name, '): Disconnected');
    }
  });
}
// Card inserted.
else if ((changes & this.SCARD_STATE_PRESENT) && (status.state & this.SCARD_STATE_PRESENT)) {
  console.log('Status(', reader.name, '): Card inserted');
  reader.connect({ share_mode : this.SCARD_SHARE_SHARED }, function(err, protocol) {
    if (err) {
      console.log('Error(', reader.name, '):', err);
    }
    else {
      console.log('Protocol(', reader.name, '):', protocol);

//Read card UID: [0xFF, 0xCA, 0x00, 0x00, 0x00]
//UID is specified in the ISO 14443 T=CL transport protocol while APDU's are specified in the ISO 7816 application layer protocol.
//"Get Data Command" is defined in PCSC 3 v2. If your driver is PCSC v2 compliant, you can get UID using it:
//Class = 0xFF
//INS = 0xCA
//P1 = 0x00
//P2 = 0x00
//Le = 0x00 (return full length: ISO14443A single 4 bytes, double 7 bytes, triple 10 bytes, for ISO14443B 4 bytes PUPI, for 15693 8 bytes UID)
//Expected response: Data+SW1SW2
//
var message = new Buffer([0xFF, 0xCA, 0x00, 0x00, 0x00]);
reader.transmit(message, 40, protocol, function(err, data) {
  if (err) {
    console.log('Error(', reader.name, '):', err);
  } else {
// buf.readUIntLE(offset, byteLength[, noAssert])
//Set noAssert to true to skip validation of value and offset. Defaults to false.
//
var lastRead = data.readUIntBE(0, 6, true).toString(16);
var post = {evento: lastRead};
console.log('Status(', reader.name, '): Read:', data, ' toString:', lastRead);
//emit
io.emit('data_received', lastRead);
}
});
}
});
}
}
});
 
 reader.on('end', function() {
  console.log('Status(', reader.name, '): Removed');

// Release resources.
reader.close();
pcsc.close();
});
});
pcsc.on('error', function(err) {
  console.log('Error( PCSC ): ', err);
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

router.get('/get/1565568270358',function(req,res){
  var productURL = 'https://6bfd57eed404cfcbfb7c7ca4bcd8a374:920c7c6f4b911fe9d9fddd2d1a6d00a6@hackdays24price.myshopify.com/admin/products/1565568270358.json';
  request(productURL, function (error, response, body) {
    io.emit('get_product', response);
  });
  res.send();
});

router.get('/get/1565568335894',function(req,res){
  var productURL = 'https://6bfd57eed404cfcbfb7c7ca4bcd8a374:920c7c6f4b911fe9d9fddd2d1a6d00a6@hackdays24price.myshopify.com/admin/products/1565568335894.json';
  request(productURL, function (error, response, body) {
    io.emit('get_product', response);
  });
  res.send();
});

router.get('/get/1565568368662',function(req,res){
  var productURL = 'https://6bfd57eed404cfcbfb7c7ca4bcd8a374:920c7c6f4b911fe9d9fddd2d1a6d00a6@hackdays24price.myshopify.com/admin/products/1565568368662.json';
  request(productURL, function (error, response, body) {
    io.emit('get_product', response);
  });
  res.send();
});

router.get('/get/1565568434198',function(req,res){
  var productURL = 'https://6bfd57eed404cfcbfb7c7ca4bcd8a374:920c7c6f4b911fe9d9fddd2d1a6d00a6@hackdays24price.myshopify.com/admin/products/1565568434198.json';
  request(productURL, function (error, response, body) {
    io.emit('get_product', response);
  });
  res.send();
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