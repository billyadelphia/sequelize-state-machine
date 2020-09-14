"use strict";
/**
 * Sequelize state machine
 * Author billyadelphia
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const StateMachineValidation_1 = require("./StateMachineValidation");
class StateMachine {
    constructor() {
        this.states = [];
        this.field = "state";
        this.transition = {};
        this.transitionIsStrict = true;
    }
    init(SequelizeModel) {
        const states = this.states;
        const field = this.field;
        const transitionIsStrict = this.transitionIsStrict;
        const transition = this.transition;
        const hooks = ["beforeSave", "afterSave"];
        const stateMachine = this;
        /**
         * Adding magic method
         */
        for (const trs of Object.keys(transition)) {
            // add can function
            SequelizeModel.prototype[`can${capitalize(trs)}`] = function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (this) {
                        try {
                            console.log("trs", trs);
                            console.log("this[field]", this[field]);
                            console.log("transition[trs].to", transition[trs].to);
                            const can = stateMachine.can(transition[trs], this[field], transition[trs].to);
                            if (!can) {
                                return false;
                            }
                            return true;
                        }
                        catch (e) {
                            throw new StateMachineValidation_1.default(e.message);
                        }
                    }
                });
            };
            // add state machine function
            SequelizeModel.prototype[trs] = function () {
                return tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (SequelizeModel) {
                        try {
                            // let updating: any = {};
                            // updating[field] = transition[trs].to;
                            SequelizeModel[field] = transition[trs].to;
                            yield this.save();
                            return SequelizeModel;
                        }
                        catch (e) {
                            throw new StateMachineValidation_1.default(e.message);
                        }
                    }
                });
            };
        }
        /**
         * End of adding magic method
         */
        for (const hook of hooks) {
            SequelizeModel.addHook(hook, `StateMachine${capitalize(hook)}`, (instance, options) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const dataValue = instance[field];
                    if (this.inStates(states, dataValue)) {
                        if (instance.previous(dataValue) !== dataValue) {
                            let hookValidation = true;
                            let hookFunction = "after";
                            if (hook === "beforeSave") {
                                if (instance.isNewRecord) {
                                    hookValidation = this.isInitialState(states, dataValue);
                                }
                                else {
                                    hookValidation = this.fromPreviousState(transition, dataValue, instance.previous(dataValue));
                                }
                                hookFunction = "before";
                            }
                            if (transitionIsStrict ? hookValidation : true) {
                                let beforeValidate = true;
                                /**
                                 * validation function
                                 */
                                if (typeof instance[`validate${capitalize(dataValue)}`] ===
                                    "function") {
                                    beforeValidate = yield instance[`validate${capitalize(instance[field])}`]();
                                }
                                /**
                                 * end of validation function
                                 */
                                // if validation correct or not returning false, then procced to after or before function
                                if (beforeValidate !== false) {
                                    if (typeof instance[`${hookFunction}${capitalize(instance[field])}`] === "function") {
                                        yield instance[`${hookFunction}${capitalize(instance[field])}`]();
                                    }
                                }
                                else {
                                    throw new StateMachineValidation_1.default(`error : validate${capitalize(instance[field])} is invalid`);
                                }
                            }
                            else {
                                throw new StateMachineValidation_1.default(`error : incorrect transition validation`);
                            }
                        }
                    }
                    else {
                        throw new StateMachineValidation_1.default("error : state not found");
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
            throw new StateMachineValidation_1.default("states must be an array");
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
    inStates(states, state) {
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
            throw new StateMachineValidation_1.default("states is not an array !");
        }
    }
    can(transition, from, to) {
        if (from !== to) {
            if (typeof transition === "object") {
                let fromTrue = false;
                if (typeof transition.from === "string") {
                    fromTrue = transition.from === from;
                }
                else {
                    fromTrue = transition.from.includes(from);
                }
                let toTrue = false;
                if (typeof transition.to === "string") {
                    toTrue = transition.to === to;
                }
                else {
                    toTrue = transition.to.includes(from);
                }
                return fromTrue && toTrue;
            }
        }
        return false;
    }
    fromPreviousState(transition, state, previousState) {
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
                throw new StateMachineValidation_1.default("transition is not an object");
            }
        }
        else {
            return false;
        }
    }
    isInitialState(states, state) {
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
            throw new StateMachineValidation_1.default("states is not an array !");
        }
    }
}
const capitalize = (s) => {
    if (typeof s !== "string")
        return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};
exports.default = new StateMachine();
//# sourceMappingURL=index.js.map