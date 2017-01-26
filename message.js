var Performative = require('./performative.js')
var uuid = require('node-uuid');

/**
* Base class for messages transmitted by one agent to another. This class provides
* the basic attributes of messages and is typically extended by application-specific
* message classes. To ensure that messages can be sent between agents running
* on remote containers, all attributes of a message must be serializable.
*
* @author  Chinmay Pendharkar
*/

/**
* Creates an empty message.
*/
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

  /**
  * Gets a string representation of the message.
  *
  * @return string representation.
  */
  toString(){
    if (this.constructor.name == "Message"){
      return this.perf || "MESSAGE"
    }

    return this.perf || "MESSAGE" + ': ' + this.constructor.name;
  }
}

Message.classname = "org.arl.fjage.Message";

module.exports = Message;
