"use strict";

/**
 *
 */
class StateMachine {
  constructor() {
    this.states = [];
    this.field = "state";
    this.transition = {};
    this.transitionIsStrict = true;
  }
  /**
   *
   * @param {Sequelize} SequelizeModel
   * @returns {StateMachine}
   */


  init(SequelizeModel) {
    const stateMachine = this;
    const states = stateMachine.states;
    const field = stateMachine.field;
    const transitionIsStrict = stateMachine.transitionIsStrict;
    const transition = stateMachine.transition;
    const hooks = ["beforeSave", "afterSave"]; // adding magic method

    for (const trs of Object.keys(transition)) {
      SequelizeModel.prototype[trs] = async function (data) {
        if (this) {
          try {
            let updating = {};
            updating[field] = transition[trs].to;
            return await this.update(updating);
          } catch (e) {
            throw e;
          }
        }
      };
    }

    for (const hook of hooks) {
      SequelizeModel.addHook(hook, `StateMachine${capitalize(hook)}`, async function (instance, options) {
        try {
          if (inStates(states, instance[field])) {
            if (instance.changed(field)) {
              let hookValidation = true;
              let hookFunction = "after";

              if (hook === "beforeSave") {
                if (instance.isNewRecord) {
                  hookValidation = isInitialState(states, instance[field]);
                } else {
                  hookValidation = fromPreviousState(transition, instance[field], instance.previous(field));
                }

                hookFunction = "before";
              }

              if (transitionIsStrict ? hookValidation : true) {
                let beforeValidate = true;

                if (typeof instance[`validate${capitalize(instance[field])}`] === "function") {
                  beforeValidate = await instance[`validate${capitalize(instance[field])}`]();
                }

                if (beforeValidate !== false) {
                  if (typeof instance[`${hookFunction}${capitalize(instance[field])}`] === "function") {
                    await instance[`${hookFunction}${capitalize(instance[field])}`]();
                  }
                } else {
                  throw new Error(`error : validate${capitalize(instance[field])} is invalid`);
                }
              } else {
                throw new Error(`error : incorrect transition validation`);
              }
            }
          } else {
            throw new Error("error : state not found");
          }
        } catch (e) {
          throw e;
        }
      });
    }

    return this;
  }
  /**
   *
   * @param {array} states
   * @returns {StateMachine}
   */


  addStates(states) {
    if (Array.isArray(states)) {
      this.states = states;
      return this;
    } else {
      throw new Error("states must be an array");
    }
  }
  /**
   *
   * @param {string} field
   * @returns {StateMachine}
   */


  stateField(field) {
    if (field) {
      this.field = field;
    }

    return this;
  }
  /**
   *
   * @param {object} transition
   * @returns {StateMachine}
   */


  addTransition(transition) {
    this.transition = transition;
    return this;
  }
  /**
   *
   * @param {boolean} bool
   */


  isStrict(bool) {
    this.transitionIsStrict = typeof bool === "boolean" ? bool : true;
    return this;
  }

}
/**
 *
 * @param {array} states
 * @param {string} state
 * @returns {boolean}
 */


const inStates = function (states, state) {
  if (states && states.length) {
    let correctState = false;

    for (const status of states) {
      if (typeof status === "object") {
        if (status[state]) {
          correctState = true;
          break;
        }
      } else {
        if (status === state) {
          correctState = true;
          break;
        }
      }
    }

    return correctState;
  } else {
    throw new Error("states is not an array !");
  }
};
/**
 *
 * @param {object} transition
 * @param {string} state
 * @param {string} previousState
 * @returns {boolean}
 */


const fromPreviousState = function (transition, state, previousState) {
  console.log(state, previousState);

  if (state !== previousState) {
    if (typeof transition === "object") {
      let isTrue = false;

      for (const object of Object.keys(transition)) {
        let transitionData = transition[object];

        if (transitionData.to === state) {
          if (typeof transitionData.from === "string") {
            if (transitionData.from === previousState) {
              isTrue = true;
              break;
            } else {
              isTrue = false;
            }
          } else {
            if (transitionData.from[previousState]) {
              isTrue = true;
              break;
            } else {
              isTrue = false;
            }
          }
        } else {
          isTrue = false;
        }
      }

      return isTrue;
    } else {
      throw new Error("transition is not an object");
    }
  } else {
    return false;
  }
};
/**
 *
 * @param {array} states
 * @param {string} state
 * @returns {boolean}
 */


const isInitialState = function (states, state) {
  if (states && states.length) {
    let correctState = true;

    for (const status of states) {
      if (typeof status === "object") {
        if (status[state]) {
          if (status[state].initial === false) {
            correctState = false;
            break;
          }

          if (status[state].initial === true) {
            correctState = true;
            break;
          }
        } else {
          correctState = false;
          break;
        }
      } else {
        correctState = false;
        break;
      }
    }

    return correctState;
  } else {
    throw new Error("states is not an array !");
  }
};
/**
 *
 * @param {string} s
 * @returns {string}
 */


const capitalize = s => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

module.exports = new StateMachine();