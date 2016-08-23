var net = require('net');
var util = require('util');
var events = require('events');
var process = require('process');

var uuid = require('node-uuid');

var Actions = require('./actions.js');
var AgentID = require('../agentid.js');
var Message = require('../message.js');


class Gateway {
  constructor(hostname = 'localhost', port = 1100, name){

    this.name = name || "JavascriptGW-"+uuid.v4();
    this._subscribers = [];
    this._listeners = [];
    this._msgBuffer = '';

    this._socket = net.Socket();
    this._socket.connect({
      port: port,
      host : hostname
    });
    this._socket.setEncoding('ascii');

    // When new data is _received.
    this._socket.on('data', this._receive.bind(this));

    // When _socket is closed from the server side.
    this._socket.on('end', (e) =>{
      console.warn("_Socket closed from server side");
    });

    // When _socket encounters and error
    this._socket.on('error', (e) => {
      console.error("_Socket Error: ", e);
    });
  }

  shutdown(){
    this._sendMessage({
      action : Actions.SHUTDOWN
    })
  }

  send(msg){
    if (!msg.recipient){
      console.warn("No recipient. Ignoring Message");
      return;
    }

    outgoingMsg = {}
    outgoingMsg.action = Action.SEND;
    outgoingMsg.relay = true;
    outgoingMsg.sender = this.name;
    outgoingMsg.msgType = msg.classname
    outgoingMsg.message = this._jsonfiy(msg)

    this.send(outgoingMsg);
  }

  receive(filter, timeout, callback){
    if (!callback){
      console.warn("No callback provided. Not registering listener");
      return;
    }
    this._listeners.push({
      filter: filter,
      timeout : new Date().getTime() + timeout || 0,
      callback: callback,
    })
  }

  request(msg, timeout, callback){
    this.send(msg);
    this.receive(msg, timeout, callback);
  }

  topic(topic){
    if (topic instanceof String){
      return new AgentID(topic, true);
    }else if (topic instanceof AgentID){
      if (topic.isTopic){
        return topic
      }else {
        return new AgentID(topic.name + "__ntf", true);
      }
    }else{
      return AgentID(topic.classname + "."+topic, true);
    }
  }

  subscribe (topic){
    if (!(topic instanceof AgentID)){
      console.warn("Invalid AgentID");
      return;
    }
    if (!topic.isTopic){
      topic = new AgentID(topic.name + "__ntf", true);
    }
    this._subscribers.push(topic);
    return true;
  }

  unsubscribe (topic){

    if (!(topic instanceof AgentID)){
      console.warn("Invalid AgentID");
      return;
    }

    topicName = topic.name;
    if (!topic.isTopic){
      topicName = topic.name + "__ntf";
    }

    var topicIndex = this._subscribers.find((sub) => {
      return sub.name === topicName;
    });

    if (topicIndex > 0){
      this._subscribers.splice(topicIndex,1);
      return true;
    }
  }

  _sendMessage(message){
    this._socket.write(JSON.stringify(message) + "/n", 'ascii');
  }

  _receive(data){
    var parts = data.toString().split('\n');
    this._msgBuffer += parts.shift();
    while (parts.length > 0) {
      this.emit('json', this._msgBuffer);
      var parsedMsg = JSON.parse(this._msgBuffer);
      this._parseIncoming(parsedMsg);
      this._msgBuffer = parts.shift();
    }
  }

  _isSubscribedTopic(recipient){
    return recipient[0] === "#" && this._subscribers.find((sub) => {
      return sub.name === recipient.substr(1);
    });
  }

  _parseIncoming(request){
    if (!request.action) return;

    var response = {};

    if (request.action === Actions.AGENTS){


      response.inResponseTo = request.action;
      response.id = request.id;
      response.agentIDs = [this.nam];

      this._sendMessage(response);

    }else if (request.action === Actions.CONTAINS_AGENTS){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.answer       = request.agentID === self.name

      this._sendMessage(response);

    }else if (request.action === Actions.SERVICES){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.services      = [];

      this._sendMessage(response);

    }else if (request.action === Actions.AGENT_FOR_SERVICE){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.agentID      = "";

      this._sendMessage(response);

    }else if (request.action === Actions.AGENTS_FOR_SERVICE){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.agentIDs      = [];

      this._sendMessage(response);

    }else if (request.action === Actions.SEND){

      var message = request.message;
      if (message.recipient === this.name || this._isSubscribedTopic(message.recipient)){
        this.emit('msg',message);
        this._serviceListeners(message);
      }

    }else if (request.action === Actions.SHUTDOWN){
      this.socket.end();
    }else{

    }
  }

  _serviceListeners(message){
    console.log("Servicing", this._listeners.length);
    this._listeners.forEach((listener) => {
      if (!listener.callback || listener.timeout < new Date().getTime()){
        this._removeListener(listener);
        return
      }

      if (listener.filter instanceof Message){
        if (message.msgID == listener.filter.msgID){
          this._removeListener(listener);
          listener.callback(this._inflate(message));
        }
      } else if (typeof(listener.filter) == 'string'){
        if (message.msgType === listener.filter){
          this._removeListener(listener);
          listener.callback(this._inflate(message));
        }
      } else if (listener.filter instanceof Function){
        if (listener.filter(message)){
          this._removeListener(listener);
          listener.callback(this._inflate(message));
        }
      } else{
        // TODO
      }
    });
  }

  _inflate(msg){
    if (!msg.msgType) return msg

    var parts = msg.msgType.split('.');
    parts.splice(0,2);
    var moduleName = parts.map((part) => {return part.toLowerCase();}).join('/');

    var Msg;

    try {
      Msg = require(moduleName);
    } catch (e) {
      Msg = require('../message.js');
    }

    return new Msg(msg);
  }

  _removeListener(listener){
    process.nextTick(() => {
      var listenerIndex = this._listeners.find((thisListener) => {
        return listener == thisListener;
      });
      this._listeners.splice(listenerIndex,1);
    })
  }


  _jsonfiy(msg){
    var obj = {};

    for (var prop in msg) {
      if( msg.hasOwnProperty( prop ) && !(prop instanceof Function)) {
        obj[prop] = msg[prop];
      }
    }
    return obj
  }
}

util.inherits(Gateway, events.EventEmitter);

module.exports = Gateway;
