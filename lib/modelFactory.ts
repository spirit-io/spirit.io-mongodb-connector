import { _ } from 'streamline-runtime';
import { ModelFactoryBase } from 'spirit.io/lib/base'
import { IModelFactory, IModelActions, IModelHelper, IModelController } from 'spirit.io/lib/interfaces'
import { Connection, Schema, Model, Query } from 'mongoose';
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { ConnectionHelper } from './connectionHelper';

import express = require ('express');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const idValidator = require('mongoose-id-validator');

let trace;// = console.log;

export class ModelFactory extends ModelFactoryBase implements IModelFactory {


    public schema: Schema;
    public model: Model<any>;

    constructor(targetClass: any) {
        super(targetClass);
    }

    setup (routers: Map<string, express.Router>) {
        super.setup(routers, new ModelActions(this), new ModelHelper(this), new ModelController(this));
        
        if (Object.keys(this.$prototype).length) {
            let db = ConnectionHelper.get(this.datasource || 'mongodb');
            let schema = new Schema(this.$prototype, {_id: false, versionKey: false});
            schema.plugin(uniqueValidator);
            schema.plugin(idValidator, {connection: db});
            
            this.model = db.model(this.collectionName, schema, this.collectionName);

        }

        
    } 
}