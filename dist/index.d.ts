/**
 * Sequelize state machine
 * Author billyadelphia
 */
import { Model } from "sequelize";
interface IPrototype {
    prototype: any;
}
declare type SequelizeModel = Model & IPrototype & string;
declare class StateMachine {
    states: Array<Object | string>;
    field: "state" | string;
    transition: any;
    transitionIsStrict: boolean;
    constructor();
    init(SequelizeModel: SequelizeModel): StateMachine;
    addStates(states: Array<Object | string>): StateMachine;
    stateField(field: string): this;
    addTransition(transition: Object): this;
    isStrict(bool: boolean): this;
}
declare const _default: StateMachine;
export default _default;
