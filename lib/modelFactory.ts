import { _ } from 'streamline-runtime';
import { ModelFactoryBase } from 'spirit.io/lib/base'
import { IModelFactory, IModelActions, IModelHelper, IModelController } from 'spirit.io/lib/interfaces'
import { Connection, Schema, Model, Query } from 'mongoose';
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { ConnectionHelper } from './connectionHelper';
import { helper as objectHelper } from 'spirit.io/lib/utils';

import express = require('express');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const idValidator = require('mongoose-id-validator');

let trace;// = console.log;

export class ModelFactory extends ModelFactoryBase implements IModelFactory {


    public schema: Schema;
    public model: Model<any>;

    constructor(name: string, targetClass: any) {
        super(name, targetClass);
    }

    createSchema(): any {
        let schema = objectHelper.clone(this.$prototype);
        Object.keys(this.$references).forEach((k) => {
            if (schema[k].embedded) {
                if (schema[k].ref === this.collectionName) {
                    throw new Error(`Cyclic embedded reference not allowed: property '${k}' with type '${schema[k].ref}' can't be set on model of type '${this.collectionName}'`);
                }
                let mf = this.getModelFactoryByPath(k);
                schema[k] = mf.createSchema();
                if (this.$plurals.indexOf(k) !== -1) {
                    schema[k] = [schema[k]];
                }
            }
        });
        return new Schema(schema, { _id: false, versionKey: false } as any);
    }

    setup(routers: Map<string, express.Router>) {
        super.init(routers, new ModelActions(this), new ModelHelper(this), new ModelController(this));

        if (Object.keys(this.$prototype).length) {
            let db = ConnectionHelper.get(this.datasource || 'mongodb');
            let schema: Schema = this.createSchema();
            schema.plugin(uniqueValidator);
            schema.plugin(idValidator, { connection: db });

            this.model = db.model(this.collectionName, schema, this.collectionName);

        }


    }
}