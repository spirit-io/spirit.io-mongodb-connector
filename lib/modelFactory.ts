import { _ } from 'streamline-runtime';
import { IModelFactory, IModelActions, IModelHelper, IController } from 'spirit.io/lib/interfaces'
import { Schema, Model, Query } from 'mongoose';
import { ModelActions } from './modelActions';
import { ModelHelper } from './modelHelper';
import { Controller } from './controller';

import express = require ('express');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let trace;// = console.log;

export class ModelFactory implements IModelFactory {

    public targetClass: any;
    public collectionName: string;
    public properties: string[];
    public schemaDef: Object;
    public schema: Schema;
    public model: Model<any>;
    public actions: IModelActions;
    public helper: IModelHelper;

    constructor(targetClass: any) {
        this.targetClass = targetClass;
        this.collectionName = targetClass._collectionName;
        this.schemaDef = {};
        this.properties = [];
    }

    setup = (router: express.Router): express.Router => {
        trace && trace(`Schema registered for collection ${this.collectionName}: ${JSON.stringify(this.schemaDef,null,2)}`)

        if (Object.keys(this.schemaDef).length) {
            let schema = new Schema(this.schemaDef, {_id: false, versionKey: false});
            schema.plugin(uniqueValidator);
            this.model = mongoose.model(this.collectionName, schema, this.collectionName);
            this.actions = new ModelActions(this);
            this.helper = new ModelHelper(this);
        }

        if (this.actions) {
            let modelCtrl: IController = new Controller(this.actions);
            let name = this.collectionName;
            trace && trace("Register route: "+`/${this.collectionName}`);
            router.get(`/${name}`, modelCtrl.query);
            router.get(`/${name}/:_id`, modelCtrl.read);
            router.post(`/${name}`, modelCtrl.create);
            router.put(`/${name}/:_id`, modelCtrl.update);
            router.delete(`/${name}/:_id`, modelCtrl.delete);
            return router;  
        }
    } 
}