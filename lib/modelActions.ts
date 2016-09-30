import { _ } from 'streamline-runtime';
import { IModelActions } from 'spirit.io/lib/interfaces';
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
        //console.log("Create Item: ",item);
        let doc: any = this.modelFactory.model.create(item, _);
        return doc.toObject();
    }

    update = (_: _, _id: any, item: any, options?: any) => {
        if (item.hasOwnProperty('_id')) delete item._id;
        item._updatedAt = Date.now();
        let data: any = {};
        if (options && options.deleteMissing) {
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
        return doc && doc.toObject();
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