var Message = require('../message.js');
var Performative = require('../performative.js');

/**
 * Request to execute shell command/script.
 */
class ShellExecReq extends Message{
  constructor(){
    super()
    this.perf = Performative.REQUEST
    this.cmd;
    this.script;
    this.args;
  }

}

module.exports = ShellExecReq
