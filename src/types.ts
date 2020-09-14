import { Model } from "sequelize";

export interface IPrototype {
  prototype: any;
}

export type Hooks = "beforeSave" | "afterSave";

export interface states {
  initial: boolean;
  final: true;
}

export type SequelizeModel = Model & IPrototype & string;
