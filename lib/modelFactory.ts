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

    setup = (routers: Map<string, express.Router>) => {
        trace && trace(`Schema registered for collection ${this.collectionName}: ${require('util').inspect(this.schemaDef,null,2)}`)

        this.$fields = this.$properties.concat(Object.keys(this.$references));
        let name = this.collectionName;
        if (Object.keys(this.schemaDef).length) {
            let db = ConnectionHelper.get(this.datasource || 'mongodb');
            let schema = new Schema(this.schemaDef, {_id: false, versionKey: false});
            schema.plugin(uniqueValidator);
            schema.plugin(idValidator, {connection: db});
            
            this.model = db.model(this.collectionName, schema, this.collectionName);
            this.actions = new ModelActions(this);
            this.helper = new ModelHelper(this);
        }

        let routeName = name.substring(0,1).toLowerCase() + name.substring(1);
        let modelCtrl: IModelController = new ModelController(this);
        let v1 = routers.get('v1');
        if (this.actions) {
            trace && trace(`Register routes: /${routeName}`);
            // handle main requests
            v1.get(`/${routeName}`, modelCtrl.query);
            v1.get(`/${routeName}/:_id`, modelCtrl.read);
            v1.post(`/${routeName}`, modelCtrl.create);
            v1.put(`/${routeName}/:_id`, modelCtrl.update);
            v1.patch(`/${routeName}/:_id`, modelCtrl.patch);
            v1.delete(`/${routeName}/:_id`, modelCtrl.delete);
            // handle references requests
            v1.get(`/${routeName}/:_id/:_ref`, modelCtrl.read);
            v1.put(`/${routeName}/:_id/:_ref`, modelCtrl.update);
            v1.patch(`/${routeName}/:_id/:_ref`, modelCtrl.patch);
        }

        if (this.helper) {
            // handle execution requests
            v1.post(`/${routeName}/([\$])service/:_name`, modelCtrl.executeService);
            v1.post(`/${routeName}/:_id/([\$])execute/:_name`, modelCtrl.executeMethod);
        }
    } 
}