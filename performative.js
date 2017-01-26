
/**
 * An action represented by a message. The performative actions are a subset of the
 * FIPA ACL recommendations for interagent communication.
 *
 * @author  Chinmay Pendharkar
 */

module.exports = {
  /**
   * Request an action to be performed.
   */
  REQUEST : "request",

  /**
   * Agree to performing the requested action.
   */
  AGREE : "agree",

  /**
   * Refuse to perform the requested action.
   */
  REFUSE : "request",

  /**
   * Notification of failure to perform a requested or agreed action.
   */
  FAILURE : "failure",

  /**
   * Notification of an event.
   */
  INFORM : "inform",

  /**
   * Confirm that the answer to a query is true.
   */
  CONFIRM : "confirm",

  /**
   * Confirm that the answer to a query is false.
   */
  DISCONFIRM : "disconfirm",

  /**
   * Query if some statement is true or false.
   */
  QUERY_IF : "query_if",

  /**
   * Notification that a message was not understood.
   */
  NOT_UNDERSTOOD : "not_understood",

  /**
   * Call for proposal.
   */
  CFP : "cfp",

  /**
   * Response for CFP.
   */
  PROPOSE : "propose",

  /**
   * Cancel pending request.
   */
  CANCEL : "cancel"
}
