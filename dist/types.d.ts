import { Model } from "sequelize";
export interface IPrototype {
    prototype: any;
}
export declare type Hooks = "beforeSave" | "afterSave";
export interface states {
    initial: boolean;
    final: true;
}
export declare type SequelizeModel = Model & IPrototype & string;
