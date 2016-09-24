import { _ } from 'streamline-runtime';
import { IModelFactory, IModelHelper, IModelActions } from 'spirit.io/lib/interfaces';
import { ModelRegistry } from 'spirit.io/lib/core';

export class ModelHelper implements IModelHelper {

    private _actions: IModelActions;
    private _target: any;

    constructor(private modelFactory: IModelFactory) {
        this._actions = modelFactory.actions;
        this._target = modelFactory.targetClass;
    }

    fetchInstances = (_: _, filter?: any) => {
        let instances: any = [];
        let docs = this._actions.query(_, filter);
        for (var doc of docs) {
            instances.push(new this._target.prototype.constructor(doc.toObject()));
        }
        return instances;
    }

    fetchInstance = (_:_, _id: any) => {
        let doc = this._actions.read(_, _id);
        if (!doc) return;
        return new this._target.prototype.constructor(doc.toObject());
    }

    saveInstance = (_:_, instance: any, options?: any) => {
        let item = this._actions.createOrUpdate(_, instance._id, this.serialize(instance), options);
        this.updateValues(instance, item, {deleteMissing: true});
        if (options && options.returnInstance) return instance;
        return;
    }

    deleteInstance = (_:_, instance: any): any => {
        return this._actions.delete(_, instance._id);
    }

    serialize = (instance: any): any => {
        let item: any = {};
        for (let key of this.modelFactory.properties) {
            if (instance[key]) item[key] = instance[key];
        }
        return item;
    }

    updateValues = (instance: any, item: any, options?: any): void => {
        // update new values
        for (let key of Object.keys(item)) {
            if (this.modelFactory.properties.indexOf(key) !== -1) {
                instance[key] = item[key];
            }
        }

        if (options && options.deleteMissing) {
            // reinitialize deleted values
            for (let key of this.modelFactory.properties) {
                if (!item.hasOwnProperty(key)) {
                    instance[key] = undefined;
                }
            }
        }
    }

    getMetadata = (instance: any, metadataName: string): any => {
        return instance[metadataName];
    }
}