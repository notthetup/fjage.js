var fjage = require('../index.js');
var AgentID = require('../agentid.js');
var Message = require('../message.js');
var uuid = require('node-uuid');

var g1 = new fjage.remote.Gateway('localhost', 1101, "JSGW")

// Test Message formats
console.log("# Test Message formats")

data1 = {
  'id' : '1',
  'action':'containsAgent',
  'agentID':'shell'
}

g1.request(data1, 1000, function(msg){
  console.log(msg)
});

data2 = {
  'action' : 'send',
  'message' : {
    'msgID' : 1,
    'recipient' : '#abc',
    'sender' : 'rshell',
    'msgType' : 'org.arl.fjage.Message'
  },
  'relay' : true
}

g1.request(data2, 1000, function(msg){
  console.log(msg)
});

// Gateway Test - Message

console.log("# Gateway Test - Message")

// msg to send
m1 = new fjage.Message()

m1.recipient = '#abc'
m1.sender = 'rshell'

// m2 = g1.request(m1, 1000)
if (g1.send(m1)){
  g1.receive(null,10000, (m2) =>{
    if (m2){
      console.log(m2)
    }
  });
}

m1.recipient = '#def'
m1.sender = 'rshell'

// m2 = g1.request(m1, 1000)
if (g1.send(m1)){
  g1.receive(null,1000, (m2) =>{
    if (m2){
      console.log(m2)
    }
  });
}

// Gateway Test - Generic Message

console.log("## Gateway Test - Generic Message")

// msg to send
m1 = new fjage.GenericMessage()
m1.recipient = '#mno'

// map
m1.map["map1"] = "mapValue1"
m1.map["map2"] = "mapValue2"
m1.map["map3"] = "mapValue3"
m1.map["map4"] = "mapValue4"

// received message
m2 = new fjage.GenericMessage()
// m2 = g1.request(m1, 1000)

if (g1.send(m1)){
    g1.receive(fjage.Message,1000, (m2) =>{
      if (m2){
        console.log(m2)
      }
  });
}


console.log("## ShellExecReq Message Tests")
// ShellExecReq Message Tests

// msg to send
m3 = new fjage.shell.ShellExecReq()

m3.recipient = 'shell'
m3.sender = 'rshell'
m3.script = {"path":"samples/01_hello.groovy"}
m3.args = []

// received message
m4 = new fjage.shell.ShellExecReq()

if (g1.send(m3)){
  g1.receive(fjage.Message, 10000, (m4) => {
    if (m4){
      console.log(m4)
    }
  });
}


m5 = new fjage.shell.ShellExecReq()
m5.recipient = 'shell'
m5.sender = 'rshell'
// NOTE: Make sure either cmd or script has a value
m5.script = null
m5.args = null
m5.cmd = 'services'
m5.msgID = uuid.v4()

// received message
g1.request(m5, 10000, (m6) => {
  if (m6){
    console.log(m6)
  }
});

console.log("## AgentID Tests")

// AgentID Tests
a1 = g1.topic("manu")
console.log(a1.name)
console.log(a1.isTopic)

a2 = g1.topic(1)
console.log(a2.name)
console.log(a2.isTopic)

a3 = new fjage.AgentID("Daisy")
a4 = g1.topic(a3)
console.log(a4.name)
console.log(a4.isTopic)

a5 = new fjage.AgentID("Elle", true)
a6 = g1.topic(a5)
console.log(a6.name)
console.log(a6.isTopic)

// subscribe/unsubscribe test
console.log("## subscribe/unsubscribe test")


g1.subscribe(g1.topic("abc"))
console.log(g1._subscribers)

a1 = new fjage.AgentID("manu")

g1.subscribe(a1)
a1.is_topic = true
g1.subscribe(a1)

a1 = new fjage.AgentID("Daisy")
g1.subscribe(a1)

console.log("subscribers", g1._subscribers)

a2 = new fjage.AgentID("Daisy")
g1.unsubscribe(a2)

// g1.unsubscribe("a1")

// g1.unsubscribe(a1)

console.log("updated subscribers", g1._subscribers);

// agentForService ... test
g1.agentForService("shell")
g1.agentsForService("shell")

g1.agentForService(true)
g1.agentsForService(20)

g1.shutdown();
