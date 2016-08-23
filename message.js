var Performative = require('./performative.js')
var uuid = require('node-uuid');

class Message {
  constructor(){
    this.msgID = uuid.v4()
    this.perf;
    this.recipient;
    this.sender;
    this.inReplyTo;
  }
}

module.exports = Message;
