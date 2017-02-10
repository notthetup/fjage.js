var net = require('net');
var util = require('util');
var events = require('events');
var process = require('process');

var uuid = require('node-uuid');

var Action = require('./action.js');
var AgentID = require('../agentid.js');
var Message = require('../message.js');
var GenericMessage = require('../genericmessage.js');
var BaseMsg = require('../message.js');

/**
 * Gateway to communicate with fjage agents. Only agents in a master
 * or slave container can be accessed using this gateway.
 *
 * @author  Chinmay Pendharkar
 */

  const DEFAULT_TIMEOUT = 1000;
 /**
  * Creates a gateway connecting to a specified master container. The platform specified
  * in this call should not be started previously, and will be automatically started
  * by the gateway.
  *
  * @param platform platform to use
  * @param hostname hostname to connect to.
  * @param port TCP port to connect to.
  */
class Gateway {

  constructor(hostname = "localhost", port = 1100, name){

    this.name = name || "JavascriptGW-"+uuid.v4();
    this._subscribers = [];
    this._listeners = [];
    this._msgBuffer = "";

    this._socket = net.Socket();
    this._socket.connect({
      port: port,
      host : hostname
    });
    this._socket.setEncoding("ascii");

    // When new data is _received.
    this._socket.on("data", this._receive.bind(this));

    // When _socket is closed from the server side.
    this._socket.on("end", (e) =>{
      console.warn("Socket closed from server side");
    });

    // When _socket encounters and error
    this._socket.on("error", (e) => {
      console.error("Socket Error: ", e);
    });

    this._isDuplicate((isDupe)=>{
      if (isDupe){
        console.error("Duplicate Gateway found. Shutting down.");
        this.shutdown();
      }else{
        // console.log("Yay! No dupes");
      }
    });
  }

  /**
  * Closes the gateway. The gateway functionality may not longer be accessed after
  * this method is called.
  */
  shutdown(){
    this._socket.destroy();
  }

  /**
  * Sends a message to the recipient indicated in the message. The recipient
  * may be an agent or a topic.
  *
  * @param m message to be sent.
  */
  send(msg){
    if (!msg.recipient){
      console.warn("No recipient. Ignoring Message");
      return;
    }

    var outgoingMsg = {}
    outgoingMsg.action = Action.SEND;
    outgoingMsg.relay = true;
    outgoingMsg.sender = this.name;
    outgoingMsg.msgType = msg.classname
    outgoingMsg.message = msg.toJSON();
    if (msg.classname == GenericMessage.classname){

    }

    this.send(outgoingMsg);
  }

  /**
  * Returns a message received by the gateway and matching the given filter.
  * This method blocks until timeout if no message available.
  *
  * @param filter message filter.
  * @param timeout timeout in milliseconds.
  * @param callback called with message matching the filter, null on timeout.
  */
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

  /**
   * Sends a request and waits for a response. This method blocks until timeout
   * if no response is received.
   *
   * @param msg message to send.
   * @param timeout timeout in milliseconds.
   * @param callback called with message or null if timeout.
   */
  request(msg, timeout, callback){
    this.send(msg);
    this.receive(msg, timeout, callback);
  }

  /**
   * Returns an object representing the named topic.
   *
   * @param topic name of the topic.
   * @return object representing the topic.
   */
  topic(topic){
    if (typeof(topic) == "string"){
      return new AgentID(topic, true);
    }else if (topic instanceof AgentID){
      if (topic.isTopic){
        return topic
      }else {
        return new AgentID(topic.name + "__ntf", true);
      }
    }else{
      return new AgentID(topic.classname || typeof(topic) + "."+topic, true);
    }
  }

  /**
  * Subscribes the gateway to receive all messages sent to the given topic.
  *
  * @param topic the topic to subscribe to.
  * @return true if the subscription is successful, false otherwise.
  */
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

  /**
   * Unsubscribes the gateway from a given topic.
   *
   * @param topic the topic to unsubscribe.
   * @return true if the unsubscription is successful, false otherwise.
   */
  unsubscribe (topic){
    if (!(topic instanceof AgentID)){
      console.warn("Invalid AgentID");
      return;
    }

    var topicName = topic.name;
    if (!topic.isTopic){
      topicName = topic.name + "__ntf";
    }

    var topicIndex = this._subscribers.find((sub) => {
      return sub.name === topicName;
    });

    if (topicIndex > 0){
      this._subscribers.splice(topicIndex,1);
      return true;
    }else{
      console.error("No such topic subscribed: " + topicName);
    }
  }

  /**
  * Finds an agent that provides a named service. If multiple agents are registered
  * to provide a given service, any of the agents' id may be returned.
  *
  * @param service the named service of interest.
  * @callback a callback that returns an agent id for an agent that
  * provides the service.
  */
  agentForService(service, callback){
    var id = uuid.v4();
    var msg = {
      "action": Action.AGENT_FOR_SERVICE,
      "id": id
    }

    if (typeof(service) == "string"){
      msg.string = service;
    }else {
      msg.string = service.classname;
    }

    this._sendMessage(msg);
    this.prependOnceListener('msg-id'+id, (msg) => {
      if (callback && typeof callback === 'function'){
        callback(msg.agentID);
      }
    });
    setTimeout(()=>{
      this.removeAllListeners('msg-id'+id);
      callback();
    }, DEFAULT_TIMEOUT);
  }

  /**
  * Finds all agents that provides a named service.
  *
  * @param service the named service of interest.
  * @callback a callback that returns an array of agent ids representing
  * all agent that provide the service.
  */
  agentsForService(service, callback){
    var id = uuid.v4();
    var msg = {
      "action": Action.AGENTS_FOR_SERVICE,
      "id": id
    }
    if (typeof(service) == "string"){
      msg.string = service;
    }else {
      msg.string = service.classname;
    }
    this._sendMessage(msg);
    this.prependOnceListener('msg-id'+id, (msg) => {
        callback(msg.agentIDs);
    });
    setTimeout(()=>{
      this.removeAllListeners('msg-id'+id);
      callback();
    }, DEFAULT_TIMEOUT);
  }

  /*** Internal helper methods ***/

  _sendMessage(message){
    this._socket.write(JSON.stringify(message) + "\n", "ascii");
  }

  _receive(data){
    var parts = data.toString().split('\n');
    this._msgBuffer += parts.shift();
    while (parts.length > 0) {
      this.emit("json", this._msgBuffer);
      var parsedMsg = JSON.parse(this._msgBuffer);
      this._parseIncoming.bind(this)(parsedMsg);
      this._msgBuffer = parts.shift();
    }
  }

  _isSubscribedTopic(recipient){
    return recipient[0] === "#" && this._subscribers.find((sub) => {
      return sub.name === recipient.substr(1);
    });
  }

  _parseIncoming(request){

    var response = {};

    // console.log("Parsing..", request.action, request.id);

    if (request.action === Action.AGENTS){

      response.inResponseTo = request.action;
      response.id = request.id;
      response.agentIDs = [this.nam];

      this._sendMessage(response);

    }else if (request.action === Action.CONTAINS_AGENT){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.answer       = request.agentID === this.name

      this._sendMessage(response);

    }else if (request.action === Action.SERVICES){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.services      = [];

      this._sendMessage(response);

    }else if (request.action === Action.AGENT_FOR_SERVICE){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.agentID      = "";

      this._sendMessage(response);

    }else if (request.action === Action.AGENTS_FOR_SERVICE){

      response.inResponseTo = request.action;
      response.id           = request.id;
      response.agentIDs      = [];

      this._sendMessage(response);

    }else if (request.action === Action.SEND){

      var message = request.message;
      if (message.recipient === this.name || this._isSubscribedTopic(message.recipient)){
        this.emit("msg",message);
        this._serviceListeners(message);
      }
    }else if (request.action === Action.SHUTDOWN){
      this.socket.end();
    }else if (!request.action && request.id){
      this.emit("msg-id"+request.id,request);
    }else{
      console.error("Unknown action : " + request.action);
    }
  }

  _serviceListeners(message){

    this._listeners.forEach((listener) => {
      if (!listener.callback || listener.timeout < new Date().getTime()){
        listener.callback(null);
        this._removeListener(listener);
        return
      }

      if (listener.filter instanceof Message){
        if (message.msgID == listener.filter.msgID){
          this._removeListener(listener);
          listener.callback(this._inflate(message));
        }
      } else if (typeof(listener.filter) == "string"){
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
        console.warn("Unknown listener type");
      }
    });
  }

  _inflate(json){
    if (!json.msgType) return json

    var parts = json.msgType.split(".");
    parts.splice(0,2);
    var moduleName = parts.map((part) => {return part.toLowerCase();}).join("/");

    var Msg;

    try {
      Msg = require(moduleName);
    } catch (e) {
      Msg = BaseMsg;
    }

    var msg = new Msg();
    msg.fromJSON(json);

    return msg;
  }

  _removeListener(listener){
    process.nextTick(() => {
      var listenerIndex = this._listeners.find((thisListener) => {
        return listener == thisListener;
      });
      this._listeners.splice(listenerIndex,1);
    })
  }

  _isDuplicate(callback){
    var id = uuid.v4();
    var msg = {
      "action": Action.CONTAINS_AGENT,
      "id": id,
      "agentID": this.name
    }
    this._sendMessage(msg);
    this.prependOnceListener('msg-id'+id, (res) => {
        callback(res.answer);
    });
    setTimeout(()=>{
      this.removeAllListeners('msg-id'+id);
      callback();
    }, DEFAULT_TIMEOUT);
  }
}

util.inherits(Gateway, events.EventEmitter);

module.exports = Gateway;
