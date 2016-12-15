import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces';
import { ConnectionHelper } from './connectionHelper';
import { ModelFactory } from './modelFactory';
import { Connection } from 'mongoose';
const mongoose = require('mongoose');

export class MongodbConnector implements IConnector {
    private _datasource: string = 'mongodb';
    private _config: any;

    constructor(config: any) {
        this._config = config;
    }

    get datasource(): string {
        return this._datasource;
    }

    set config(config: any) {
        this._config = config || {};
        if (this._config.mongoose) {
            if (this._config.mongoose.debug) mongoose.set('debug', true);
        }
    }
    get config() {
        return this._config;
    }

    connect(datasourceKey: string, parameters: any): any {
        ConnectionHelper.connect(datasourceKey, parameters);
    }

    createModelFactory(name: string, myClass: any): IModelFactory {
        return new ModelFactory(name, myClass);
    }
}