var Performative = require('../performative.js');

class ShellExecReq extends Message{
  constructor(){
    super()
    this.perf = Performative.REQUEST
    this.cmd;
    this.script;
    this.args;
  }

}
