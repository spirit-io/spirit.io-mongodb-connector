import { _ } from 'streamline-runtime';
import { IModelFactory, IModelActions, IModelHelper, IController } from 'spirit.io/lib/interfaces'
import { Connection, Schema, Model, Query } from 'mongoose';
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { ModelController } from './modelController';
import { ConnectionHelper } from './connectionHelper';

import express = require ('express');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let trace = console.log;

export class ModelFactory implements IModelFactory {

    public targetClass: any;
    public collectionName: string;
    public properties: string[];
    public statics: string[];
    public methods: string[];
    public schemaDef: Object;
    public schema: Schema;
    public model: Model<any>;
    public actions: IModelActions;
    public helper: IModelHelper;
    public datasource: string;

    constructor(targetClass: any) {
        this.targetClass = targetClass;
        this.collectionName = targetClass._collectionName;
        this.schemaDef = {};
        this.properties = [];
        this.statics = [];
        this.methods = [];
    }

    setup = (routers: Map<string, express.Router>) => {
        trace && trace(`Schema registered for collection ${this.collectionName}: ${JSON.stringify(this.schemaDef,null,2)}`)

        let name = this.collectionName;
        if (Object.keys(this.schemaDef).length) {
            let schema = new Schema(this.schemaDef, {_id: false, versionKey: false});
            schema.plugin(uniqueValidator);
            
            let db = ConnectionHelper.get(this.datasource || 'mongodb:default');
            this.model = db.model(this.collectionName, schema, this.collectionName);
            this.actions = new ModelActions(this);
            this.helper = new ModelHelper(this);
        }

        let modelCtrl: IController = new ModelController(this);
        let v1 = routers.get('v1');
        if (this.actions) {
            trace && trace(`Register route: /${name}`);
            v1.get(`/${name}`, modelCtrl.query);
            v1.get(`/${name}/:_id`, modelCtrl.read);
            v1.post(`/${name}`, modelCtrl.create);
            v1.put(`/${name}/:_id`, modelCtrl.update);
            v1.delete(`/${name}/:_id`, modelCtrl.delete);
        }

        v1.post(`/${name}/([\$])service/:_name`, modelCtrl.executeService);
        v1.post(`/${name}/:_id/([\$])method/:_name`, modelCtrl.executeMethod);
    } 
}