/**
* An identifier for an agent or a topic.
*
* @author  Chinmay Pendharkar
*/


/**
* Constructor to create an agent id given the agent's name.
*
* @param name name of the agent.
*/
class AgentID {
  constructor(name, isTopic){
    this.name = name;
    this.isTopic = isTopic;
  }
}

module.exports = AgentID;
