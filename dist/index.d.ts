/**
 * Sequelize state machine
 * Author billyadelphia
 */
import { SequelizeModel } from "./types";
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
    private inStates;
    private can;
    private fromPreviousState;
    private isInitialState;
}
declare const _default: StateMachine;
export default _default;
