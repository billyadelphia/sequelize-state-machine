"use strict";
/**
 * Sequelize state machine
 * Author billyadelphia
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class StateMachine {
    constructor() {
        this.states = [];
        this.field = "state";
        this.transition = {};
        this.transitionIsStrict = true;
    }
    init(SequelizeModel) {
        const stateMachine = this;
        const states = stateMachine.states;
        const field = stateMachine.field;
        const transitionIsStrict = stateMachine.transitionIsStrict;
        const transition = stateMachine.transition;
        const hooks = ["beforeSave", "afterSave"];
        // adding magic method
        for (const trs of Object.keys(transition)) {
            SequelizeModel.prototype[trs] = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (SequelizeModel) {
                    try {
                        let updating = {};
                        updating[field] = transition[trs].to;
                        return yield SequelizeModel.update(updating);
                    }
                    catch (e) {
                        throw e;
                    }
                }
            });
        }
        for (const hook of hooks) {
            SequelizeModel.addHook(hook, `StateMachine${capitalize(hook)}`, (instance, options) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const dataValue = instance[field];
                    if (inStates(states, dataValue)) {
                        if (instance.previous(dataValue) !== dataValue) {
                            let hookValidation = true;
                            let hookFunction = "after";
                            if (hook === "beforeSave") {
                                if (instance.isNewRecord) {
                                    hookValidation = isInitialState(states, dataValue);
                                }
                                else {
                                    hookValidation = fromPreviousState(transition, dataValue, instance.previous(dataValue));
                                }
                                hookFunction = "before";
                            }
                            if (transitionIsStrict ? hookValidation : true) {
                                let beforeValidate = true;
                                if (typeof instance[`validate${capitalize(dataValue)}`] ===
                                    "function") {
                                    beforeValidate = yield instance[`validate${capitalize(instance[field])}`]();
                                }
                                if (beforeValidate !== false) {
                                    if (typeof instance[`${hookFunction}${capitalize(instance[field])}`] === "function") {
                                        yield instance[`${hookFunction}${capitalize(instance[field])}`]();
                                    }
                                }
                                else {
                                    throw new Error(`error : validate${capitalize(instance[field])} is invalid`);
                                }
                            }
                            else {
                                throw new Error(`error : incorrect transition validation`);
                            }
                        }
                    }
                    else {
                        throw new Error("error : state not found");
                    }
                }
                catch (e) {
                    throw e;
                }
            }));
        }
        return this;
    }
    addStates(states) {
        if (Array.isArray(states)) {
            this.states = states;
            return this;
        }
        else {
            throw new Error("states must be an array");
        }
    }
    stateField(field) {
        if (field) {
            this.field = field;
        }
        return this;
    }
    addTransition(transition) {
        this.transition = transition;
        return this;
    }
    isStrict(bool) {
        this.transitionIsStrict = typeof bool === "boolean" ? bool : true;
        return this;
    }
}
const inStates = (states, state) => {
    if (states && states.length) {
        let correctState = false;
        for (const status of states) {
            if (typeof status === "object") {
                if (status[state]) {
                    correctState = true;
                    break;
                }
            }
            else {
                if (status === state) {
                    correctState = true;
                    break;
                }
            }
        }
        return correctState;
    }
    else {
        throw new Error("states is not an array !");
    }
};
const fromPreviousState = (transition, state, previousState) => {
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
                        }
                        else {
                            isTrue = false;
                        }
                    }
                    else {
                        if (transitionData.from.includes(previousState)) {
                            isTrue = true;
                            break;
                        }
                        else {
                            isTrue = false;
                        }
                    }
                }
                else {
                    isTrue = false;
                }
            }
            return isTrue;
        }
        else {
            throw new Error("transition is not an object");
        }
    }
    else {
        return false;
    }
};
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
                }
                else {
                    correctState = false;
                    break;
                }
            }
            else {
                correctState = false;
                break;
            }
        }
        return correctState;
    }
    else {
        throw new Error("states is not an array !");
    }
};
const capitalize = (s) => {
    if (typeof s !== "string")
        return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};
exports.default = new StateMachine();
//# sourceMappingURL=index.js.map