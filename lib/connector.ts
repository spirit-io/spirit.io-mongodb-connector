import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { ConnectionHelper } from './connectionHelper';
import { ModelFactory } from './modelFactory';
import { Connection } from 'mongoose';
const mongoose = require('mongoose');

export class MongodbConnector implements IConnector {
    private _datasource: string = 'mongodb';

    constructor(config: any = {}) {
        if (config.mongoose) {
            if (config.mongoose.debug) mongoose.set('debug', true);
        }
    }
    connect = (datasourceKey: string, parameters: any): any => {
        ConnectionHelper.connect(datasourceKey, parameters);
    }

    createModelFactory = (myClass: any): IModelFactory => {
        return new ModelFactory(myClass);
    }

    get datasource(): string {
        return this._datasource;
    }
}