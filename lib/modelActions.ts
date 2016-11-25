import { _ } from 'streamline-runtime';
import { IModelActions, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelRegistry } from 'spirit.io/lib/core';
import { ModelFactory } from './modelFactory';
import { Schema, Model, Query, MongooseDocument } from 'mongoose';
const uuid = require('uuid');
const mongoose = require('mongoose');

function ensureId(item: any) {
    item._id = item._id || uuid.v4();
}

export class ModelActions implements IModelActions {

    constructor(private modelFactory: ModelFactory) { }

    query(_: _, filter: Object = {}, options?: any) {
        options = options || {};
        let fields = Array.from(this.modelFactory.$fields.keys()).join(' ');
        let query: Query<any> = this.modelFactory.model.find(filter, fields);
        if (options.includes) this.populateQuery(query, options.includes);
        let docs = (<any>query).exec(_);
        return docs && docs.map(doc => {
            return doc.toObject()
        });
    }

    read(_: _, filter: any, options?: any) {
        options = options || {};
        let query: Query<any> = !filter || typeof filter === 'string' ? this.modelFactory.model.findById(filter) : this.modelFactory.model.findOne(filter);
        if (options.includes) this.populateQuery(query, options.includes);
        let doc = (<any>query).exec(_);
        let res = doc && doc.toObject();

        if (!res) {
            return null;
        } else {
            if (options.ref) {
                let refRes: any;
                let refModelFactory = this.modelFactory.getModelFactoryByPath(options.ref);
                let field = this.modelFactory.$fields.get(options.ref);
                if (field.isPlural) {
                    let filter = { _id: { $in: res[options.ref] } };
                    return refModelFactory.actions.query(_, filter, { includes: options.includes });
                } else {
                    return refModelFactory.actions.read(_, res[options.ref], { includes: options.includes });
                }
            } else {
                return res;
            }
        }
    }

    create(_: _, item: any, options?: any) {
        ensureId(item);
        item._createdAt = new Date();
        return this.update(_, item._id, item, options);
    }

    update(_: _, _id: any, item: any, options?: any) {
        if (item.hasOwnProperty('_id')) delete item._id; // TODO: clean data _created, _updated...
        item._updatedAt = new Date();
        let data: any = {};
        let reverseProperties: string[] = [];
        if (options.deleteMissing) {
            if (options.ref) {
                let key = options.ref;
                let field = this.modelFactory.$fields.get(key);
                if (field && item.hasOwnProperty(key)) {
                    // read only properties MUST NOT be updated, but CAN be inserted at creation
                    if (!options.deleteReadOnly || (options.deleteReadOnly && !field.isReadOnly)) {
                        data.$set = data.$set || {};
                        // TODO: body should not contains key... Maybe I got something with processReverse that I can't remember ?
                        data.$set[key] = item[key];
                    }
                }
            } else {
                for (let [key, field] of this.modelFactory.$fields) {
                    // read only properties MUST NOT be updated, but CAN be inserted at creation
                    if (!options.deleteReadOnly || (options.deleteReadOnly && !field.isReadOnly)) {
                        if (!item.hasOwnProperty(key)) {
                            if (!field.isReadOnly) {
                                data.$unset = data.$unset || {};
                                data.$unset[key] = 1;
                            }
                        } else {
                            data.$set = data.$set || {};
                            data.$set[key] = item[key];
                        }
                    }
                }
            }
        } else {
            // TODO : manage options.ref for PATCH operation.
            for (let [key, field] of this.modelFactory.$fields) {
                if (item.hasOwnProperty(key) && item[key]) {
                    // read only properties MUST NOT be updated, but CAN be inserted at creation
                    if (!options.deleteReadOnly || (options.deleteReadOnly && !field.isReadOnly)) {
                        if (field.isPlural) {
                            data.$addToSet = data.$addToSet || {};
                            data.$addToSet[key] = { $each: (Array.isArray(item[key]) ? item[key] : [item[key]]) };
                        } else {
                            data.$set = data.$set || {};
                            data.$set[key] = item[key];
                        }
                    }
                }
            }
        }
        /* context is not declare in .d.ts file but it is mandatory to have unique validator working !!! */
        let query: any = this.modelFactory.model.findOneAndUpdate({ _id: _id }, data, { runValidators: true, new: true, upsert: true, context: 'query' } as any);
        if (options.includes) this.populateQuery(query, options.includes);

        let doc = (<Query<any>>query).exec(_);
        let res = doc && doc.toObject();
        this.processReverse(_, doc._id, res, options.ref);
        return res;
    }

    createOrUpdate(_: _, _id: any, item: any, options?: any) {
        options = options || {};
        //console.log("Create or update document with values;", item);
        let doc = this.read(_, _id);
        if (doc) {
            // console.log(`update ${_id}`);
            options.deleteReadOnly = true;
            return this.update(_, _id, item, options);
        } else {
            // console.log(`create ${_id}`);
            return this.create(_, item, options);
        }
    };

    delete(_: _, _id: any) {
        return this.modelFactory.model.remove({ _id: _id }, _);
    }

    private processReverse(_: _, _id: string, item: any, subProperty?: string): void {
        for (let path in this.modelFactory.$references) {
            let refOpt = this.modelFactory.$references[path] || {};
            let revKey = refOpt.$reverse;
            if (revKey && item.hasOwnProperty(path)) {
                let revModelFactory: IModelFactory = subProperty ? this.modelFactory.getModelFactoryByPath(subProperty) : this.modelFactory;
                let field = revModelFactory.$fields.get(path);
                // Do not update read only property
                if (field.isReadOnly) return;

                let refItem = {};
                refItem[revKey] = field.isPlural ? [_id] : _id;

                let update;
                if (field.isPlural) {
                    update = { $addToSet: {} };
                    update.$addToSet[revKey] = { $each: [_id] };
                } else {
                    update = { $set: {} };
                    update.$set[revKey] = _id;
                }

                let refIds: Array<string> = Array.isArray(item[path]) ? item[path] : [item[path]];
                //console.log("Update: "+JSON.stringify({ _id: { $in: refIds}})+":"+JSON.stringify(update));

                // update document still referenced
                (<Model<any>>revModelFactory.model).update({ _id: { $in: refIds } }, update, { multi: true }, _);


                let update2;
                if (field.isPlural) {
                    update2 = { $pull: {} };
                    update2.$pull[revKey] = { $in: [_id] };
                } else {
                    update2 = { $unset: {} };
                    update2.$unset[revKey] = 1;
                }
                //console.log("Update2: "+JSON.stringify({ _id: { $nin: refIds}})+":"+JSON.stringify(update2);

                // update documents not referenced anymore
                (<Model<any>>revModelFactory.model).update({ _id: { $nin: refIds } }, update2, { multi: true }, _);
            }
        }
    }

    private populateQuery(query: Query<any>, includes: any): void {
        for (let include of includes) {
            // do not apply populate for embedded references
            if (this.modelFactory.$prototype[include.path] && !this.modelFactory.$prototype[include.path].embedded) {
                include.model = this.modelFactory.getModelFactoryByPath(include.path).model;
                // populate is done here !!!
                query = query.populate(include);
            }
        }
    }
}