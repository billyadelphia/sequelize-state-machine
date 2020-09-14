/**
 * Sequelize state machine
 * Author billyadelphia
 */

import { Model } from "sequelize";
import { SequelizeModel, Hooks } from "./types";
import StateMachineValidation from "./StateMachineValidation";

class StateMachine {
  states!: Array<Object | string>;
  field!: "state" | string;
  transition!: any;
  transitionIsStrict!: boolean;

  constructor() {
    this.states = [];
    this.field = "state";
    this.transition = {};
    this.transitionIsStrict = true;
  }

  init(SequelizeModel: SequelizeModel): StateMachine {
    const states = this.states;
    const field: string = this.field;
    const transitionIsStrict = this.transitionIsStrict;
    const transition = this.transition;
    const hooks: Hooks[] = ["beforeSave", "afterSave"];
    const stateMachine = this;
    /**
     * Adding magic method
     */
    for (const trs of Object.keys(transition)) {
      // add can function
      SequelizeModel.prototype[`can${capitalize(trs)}`] = async function () {
        if (this) {
          try {
            console.log("trs", trs);
            console.log("this[field]", this[field]);
            console.log("transition[trs].to", transition[trs].to);
            const can = stateMachine.can(
              transition[trs],
              this[field],
              transition[trs].to
            );
            if (!can) {
              return false;
            }
            return true;
          } catch (e) {
            throw new StateMachineValidation(e.message);
          }
        }
      };

      // add state machine function
      SequelizeModel.prototype[trs] = async function () {
        if (SequelizeModel) {
          try {
            // let updating: any = {};
            // updating[field] = transition[trs].to;
            SequelizeModel[field] = transition[trs].to;
            await this.save();
            return SequelizeModel;
          } catch (e) {
            throw new StateMachineValidation(e.message);
          }
        }
      };
    }
    /**
     * End of adding magic method
     */

    for (const hook of hooks) {
      SequelizeModel.addHook(
        hook,
        `StateMachine${capitalize(hook)}`,
        async (instance: SequelizeModel, options: any) => {
          try {
            const dataValue = instance[field];

            if (this.inStates(states, dataValue)) {
              if (instance.previous(dataValue) !== dataValue) {
                let hookValidation = true;
                let hookFunction = "after";

                if (hook === "beforeSave") {
                  if (instance.isNewRecord) {
                    hookValidation = this.isInitialState(states, dataValue);
                  } else {
                    hookValidation = this.fromPreviousState(
                      transition,
                      dataValue,
                      instance.previous(dataValue)
                    );
                  }
                  hookFunction = "before";
                }

                if (transitionIsStrict ? hookValidation : true) {
                  let beforeValidate = true;
                  /**
                   * validation function
                   */
                  if (
                    typeof instance[`validate${capitalize(dataValue)}`] ===
                    "function"
                  ) {
                    beforeValidate = await instance[
                      `validate${capitalize(instance[field])}`
                    ]();
                  }
                  /**
                   * end of validation function
                   */

                  // if validation correct or not returning false, then procced to after or before function
                  if (beforeValidate !== false) {
                    if (
                      typeof instance[
                        `${hookFunction}${capitalize(instance[field])}`
                      ] === "function"
                    ) {
                      await instance[
                        `${hookFunction}${capitalize(instance[field])}`
                      ]();
                    }
                  } else {
                    throw new StateMachineValidation(
                      `error : validate${capitalize(
                        instance[field]
                      )} is invalid`
                    );
                  }
                } else {
                  throw new StateMachineValidation(
                    `error : incorrect transition validation`
                  );
                }
              }
            } else {
              throw new StateMachineValidation("error : state not found");
            }
          } catch (e) {
            throw e;
          }
        }
      );
    }

    return this;
  }

  addStates(states: Array<Object | string>): StateMachine {
    if (Array.isArray(states)) {
      this.states = states;
      return this;
    } else {
      throw new StateMachineValidation("states must be an array");
    }
  }

  stateField(field: string) {
    if (field) {
      this.field = field;
    }
    return this;
  }

  addTransition(transition: Object) {
    this.transition = transition;
    return this;
  }

  isStrict(bool: boolean) {
    this.transitionIsStrict = typeof bool === "boolean" ? bool : true;
    return this;
  }

  private inStates(states: Array<Object | string>, state: string) {
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
      throw new StateMachineValidation("states is not an array !");
    }
  }

  private can(
    transition: { from: string | string[]; to: string | string[] },
    from: string,
    to: string
  ) {
    if (from !== to) {
      if (typeof transition === "object") {
        let fromTrue = false;
        if (typeof transition.from === "string") {
          fromTrue = transition.from === from;
        } else {
          fromTrue = transition.from.includes(from);
        }
        let toTrue = false;
        if (typeof transition.to === "string") {
          toTrue = transition.to === to;
        } else {
          toTrue = transition.to.includes(from);
        }
        return fromTrue && toTrue;
      }
    }
    return false;
  }

  private fromPreviousState(
    transition: Object,
    state: string,
    previousState: string
  ) {
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
              if (transitionData.from.includes(previousState)) {
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
        throw new StateMachineValidation("transition is not an object");
      }
    } else {
      return false;
    }
  }

  private isInitialState(states: Array<Object | string>, state: string) {
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
      throw new StateMachineValidation("states is not an array !");
    }
  }
}

const capitalize = (s: string): string => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default new StateMachine();
