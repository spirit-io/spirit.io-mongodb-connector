import { _ } from 'streamline-runtime';
import { IModelActions, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelRegistry } from 'spirit.io/lib/core';
import { ModelFactory } from './modelFactory';
import { SchemaHelper } from './SchemaHelper';
import { Schema, Model, Query, DocumentQuery} from 'mongoose';
const uuid = require('node-uuid');
const mongoose = require('mongoose');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

export class ModelActions implements IModelActions {

    constructor(private modelFactory: ModelFactory) { }

    query = (_: _, filter: Object = {}, options?: any) => {
        options = options || {};
        let fields = this.modelFactory.$fields.join(' ');
        let query: Query<any> = this.modelFactory.model.find(filter, fields);
        if (options.includes) this.populateQuery(query, options.includes, options.refModel);
        return (<any>query).exec(_);
    }

    read = (_: _, id: any, options?: any) => {
        options = options || {};
        let query: Query<any> = this.modelFactory.model.findById(id);
        if (options.includes) this.populateQuery(query, options.includes, options.refModel);
        return (<any>query).exec(_);
    }

    create = (_: _, item: any) => {
        ensureId(item);
        item._createdAt = Date.now();
        item._updatedAt = Date.now();
        let doc: any = this.modelFactory.model.create(item, _);
        let res = doc.toObject();
        // populate reverse references
        this.processReverse(_, doc._id, res);
        return res;
    }

    update = (_: _, _id: any, item: any, options?: any) => {
        options = options || {};
        if (item.hasOwnProperty('_id')) delete item._id;
        item._updatedAt = Date.now();
        let data: any = {};
        let reverseProperties: string[] = [];
        if (options.deleteMissing) {
            if (options.reference) {
                let key = options.reference;
                if (this.modelFactory.$fields.indexOf(key) !== -1 && item.hasOwnProperty(key)) {
                    data.$set = data.$set || {};
                    data.$set[key] = item[key];
                }
            } else {
                for (let key of this.modelFactory.$fields) {
                    if (!item.hasOwnProperty(key)) {
                        if (key.indexOf('_') !== 0) {
                            data.$unset = data.$unset || {};
                            data.$unset[key] = 1;
                        }
                    } else {
                        data.$set = data.$set || {};
                        data.$set[key] = item[key];
                    }
                }
            }
        } else {
            for (let key of this.modelFactory.$fields) {
                if (item.hasOwnProperty(key)) {
                    if (this.modelFactory.$plurals.indexOf(key) !== -1) {
                        data.$addToSet = data.$addToSet || {};
                        data.$addToSet[key] = { $each:  (Array.isArray(item[key]) ? item[key] : [item[key]])};
                    } else {
                        data.$set = data.$set || {};
                        data.$set[key] = item[key];
                    }
                }
            }
        }
        /* context is not declare in .d.ts file but it is mandatory to have unique validator working !!! */
        let doc = this.modelFactory.model.findOneAndUpdate({ _id: _id }, data, { runValidators: true, new: true, context: 'query' }, _);
        let res = doc && doc.toObject();
        this.processReverse(_, doc._id, res, options.reference);
        return res;
    }

    createOrUpdate = function (_: _, _id: any, item: any, options?: any) {

        let doc = this.read(_, _id);
        if (doc) {
           // console.log(`update ${_id}`);
            return this.update(_, _id, item, options);
        } else {
           // console.log(`create ${_id}`);
            return this.create(_, item);
        }
    };

    delete = (_: _, _id: any) => {
        return this.modelFactory.model.remove({ _id: _id }, _);
    }

    private processReverse = (_: _, _id: string, item: any, subProperty?: string): void => {
        for (let path in this.modelFactory.$references) {
            let refOpt = this.modelFactory.$references[path] || {};
            if (refOpt.$reverse && item.hasOwnProperty(path)) {
                let revModelFactory: IModelFactory = subProperty ? SchemaHelper.getModelFactoryByPath(this.modelFactory.model, subProperty) : this.modelFactory;

                let revIsPlural = revModelFactory.$plurals.indexOf(refOpt.$reverse) !== -1;
                let refItem = {};
                refItem[refOpt.$reverse] = revIsPlural ? [_id] : _id;

                let update;
                if (revIsPlural) {
                    update = {$addToSet: {}};
                    update.$addToSet[refOpt.$reverse] = { $each: [_id] };
                } else {
                    update = {$set: {}};
                    update.$set[refOpt.$reverse] = _id;
                }
                
                let refIds: Array<string> = Array.isArray(item[path]) ? item[path] : [item[path]];
                //console.log("Update: "+JSON.stringify({ _id: { $in: refIds}})+":"+JSON.stringify(update));
                
                // update document still referenced
                (<Model<any>>revModelFactory.model).update({ _id: { $in: refIds}}, update, { multi: true }, _);


                let update2;
                if (revIsPlural) {
                    update2 = {$pull: {}};
                    update2.$pull[refOpt.$reverse] = { $in: [_id] };
                } else {
                    update2 = {$unset: {}};
                    update2.$unset[refOpt.$reverse] = 1;
                }
                //console.log("Update2: "+JSON.stringify({ _id: { $nin: refIds}})+":"+JSON.stringify(update2);

                // update documents not referenced anymore
                (<Model<any>>revModelFactory.model).update({ _id: { $nin: refIds}}, update2, { multi: true }, _);
            }
        }
    }

    private populateQuery = (query: Query<any>, includes: any, _model: Model<any>): void => {
        function parseIncludesStr(_includes) {
            function parseIncludeStr(_include) {
                let opt: any = {};
                if (_include.indexOf('.')) {
                    let parts = _include.split('.');
                    opt.path = parts[0];
                    opt.select = parts[1];
                } else {
                    opt.path = _include;
                }
                transformed.push(opt);
            }
            let transformed = [];
            if (_includes.indexOf(',')) {
                _includes.split(',').forEach(i => {
                    parseIncludeStr(i);
                });
            } else {
                 parseIncludeStr(_includes);
            }
            return transformed;
        }


        if (includes.charAt(0) === '{' || includes.charAt(0) === '[') {
            try {
                includes = JSON.parse(includes);
            } catch (err) {
                throw new Error('JSON includes filter is not valid');
            }
        }

        // transform parameter to array of objects
        if (typeof includes === "string") {
            includes = parseIncludesStr(includes);
        }
        if (!Array.isArray(includes)) {
            includes = [includes];
        }
        for (let include of includes) {
            include.model = SchemaHelper.getModelFactoryByPath(_model || this.modelFactory.model, include.path).model;
            // populate is done here !!!
            query = query.populate(include);
        }
    }
}