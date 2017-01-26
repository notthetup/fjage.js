var Message = require('./message.js');


/**
* A message class that can convey generic messages represented by key-value pairs.
*
* @author  Chinmay Pendharkar
*/
class GenericMessage extends Message{
  constructor (){
    super();
    this.map = {}
  }
}

GenericMessage.classname = "org.arl.fjage.GenericMessage";

module.exports = GenericMessage;
