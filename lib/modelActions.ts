import { _ } from 'streamline-runtime';
import { IModelActions } from 'spirit.io/lib/interfaces';
import { ModelRegistry } from 'spirit.io/lib/core';
import { ModelFactory } from './modelFactory';
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
        if (options.includes) this.populateQuery(query, options.includes);
        return (<any>query).exec(_);
    }

    read = (_: _, id: any, options?: any) => {
        options = options || {};
        let query: Query<any> = this.modelFactory.model.findById(id);
        if (options.includes) this.populateQuery(query, options.includes);
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
        if (item._id) delete item._id;
        item._updatedAt = Date.now();
        let data: any = { $set: item };
        if (options && options.deleteMissing) {
            for (let key of this.modelFactory.$fields) {
                if (!item.hasOwnProperty(key)) {
                    data.$unset = data.$unset || {};
                    data.$unset[key] = 1;
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

    private populateQuery = (query: Query<any>, includes: any): void => {
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
            let _model = this.modelFactory.model;
            let _treeEntry = _model.schema['tree'][include.path];
            let _ref = _treeEntry ? (Array.isArray(_treeEntry) ? _treeEntry[0].ref : _treeEntry.ref) : null;
            if (!_ref) throw new Error(`path '${include.path}' not found in collection '${_model.collection.name}'`);

            // specifying model when populate is necessary for multiple database usage
            let mf = ModelRegistry.getByName(_ref)
            if (!mf) throw new Error(`Class hasn't been registered for model '${include.path}'.`);
            include.model = mf.model;
            // populate is done here !!!
            query = query.populate(include);
        }
    }
}