import { _ } from 'streamline-runtime';
import { IModelActions } from 'spirit.io/lib/interfaces';
import { ModelFactory } from './modelFactory';
import { Schema, Model, Query, DocumentQuery} from 'mongoose';

const mongoose = require('mongoose');


function ensureId(item: any) {
    if (item._id && typeof item._id === "string") {
        item._id = mongoose.Types.ObjectId(item._id);
    } else {
        item._id = item._id || mongoose.Types.ObjectId();
    }
}

function populateQuery(query: Query<any>, includes: string) {
    try {
        includes = JSON.parse(includes);
    } catch(err) {}
    if (typeof includes === "string" || (typeof includes === "object" && !Array.isArray(includes))) {
        query = query.populate(includes);
    } else {
        for (let include of includes) {
            query = query.populate(include);
        }
    }
}

export class ModelActions implements IModelActions {

    constructor(private modelFactory: ModelFactory) { }

    query = (_: _, filter: Object = {}, options?: any) => {
        options = options || {};
        let query: Query<any> = this.modelFactory.model.find(filter, this.modelFactory.properties.join(' '));
        if (options.includes) populateQuery(query, options.includes);
        return (<any>query).exec(_);
    }

    read = (_: _, id: any, options?: any) => {
        options = options || {};
        let query: Query<any> = this.modelFactory.model.findById(id);
        if (options.includes) populateQuery(query, options.includes);
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
        let data: any = {$set: item};
        if (options && options.deleteMissing) {
            for (let key of this.modelFactory.properties) {
                if (!item.hasOwnProperty(key)) {
                    data.$unset = data.$unset || {};
                    data.$unset[key] = 1;
                }
            }
        }
        //console.log("Update Item: ",item);
        /* context is not declare in .d.ts file but it is mandatory to have unique validator working !!! */
        let doc = this.modelFactory.model.findOneAndUpdate({_id: _id}, data, {runValidators: true, new: true, context: 'query'}, _);
        return doc && doc.toObject();
    }

    createOrUpdate = function (_: _, _id: any, item: any, options?: any) {
        
        let doc = this.read(_, _id);
        if (doc) {
            //console.log(`update ${_id}`);
            return this.update(_, _id , item, options);
        } else {
            //console.log(`create ${_id}`);
            return this.create(_, item);
        }
    };

    delete = (_: _, _id: any) => {
        return this.modelFactory.model.remove({ _id: _id }, _);
    }
}