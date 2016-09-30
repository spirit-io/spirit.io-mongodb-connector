import { ModelRegistry } from 'spirit.io/lib/core';
import { IModelFactory } from 'spirit.io/lib/interfaces'
import { Model } from 'mongoose';

export class SchemaHelper {
    static getModelFactoryByPath = (model: Model<any>, path: string): IModelFactory => {
            let _treeEntry = model.schema['tree'][path];
            let _ref = _treeEntry ? (Array.isArray(_treeEntry) ? _treeEntry[0].ref : _treeEntry.ref) : null;
            if (!_ref) throw new Error(`path '${path}' not found in collection '${model.collection.name}'`);

            // specifying model when populate is necessary for multiple database usage
            let mf = ModelRegistry.getByName(_ref)
            if (!mf) throw new Error(`Class hasn't been registered for model '${path}'.`);
            return mf;
    }
}