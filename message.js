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

  fromJSON(obj){
    for (var prop in obj) {
      if( obj.hasOwnProperty( prop ) && !(prop instanceof Function)) {
        this[prop] = obj[prop];
      }
    }
  }

  toJSON(){
    var obj = {};
    for (var prop in this) {
      if( this.hasOwnProperty( prop ) && !(this[prop] instanceof Function)) {
        obj[prop] = this[prop];
      }
    }
    return obj;
  }

  toString(){
    if (this.constructor.name == "Message")
      return this.perf || "MESSAGE"

    return this.perf || "MESSAGE" + ": " + str(this.constructor.name);
  }
}

Message.classname = "org.arl.fjage.Message";

module.exports = Message;
