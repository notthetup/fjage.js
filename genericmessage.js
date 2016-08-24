var Message = require('./message.js');

class GenericMessage extends Message{
  constructor (){
    super();
    this.map = {}
  }
}

GenericMessage.classname = "org.arl.fjage.GenericMessage";

module.exports = GenericMessage;
