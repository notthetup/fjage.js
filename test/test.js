var Gateway = require('../remote/gateway');

var gateway = new Gateway('localhost', 1101);

gateway.receive("org.arl.modem.DSPStatusNtf", 1000000, (msg) => {
  console.log("Callback", msg);
})

// var message = fjage.Message();
//
// message.recipient = '#abc';
// message.sender = 'rshell';
//
// # received message
//
// g1.send(message)
//
// g1.receive(filter,function (message){
//   console.log(message.msgID)
//   console.log(message.recipient)
//   console.log(message.sender
//   console.log(message.performative)
//   console.log(message.inReplyTo)
// });
//
// g1.shutdown()
