import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelFactory } from './modelFactory';
import { Connection } from 'mongoose';
import * as mongoose from 'mongoose';
(<any>mongoose).Promise = global.Promise;

export class MongodbConnector implements IConnector {
    private _datasource: string = 'mongodb';
    private _config: any;
    public connections = new Map<string, Connection>();

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
        let opts = parameters.options;
        let db: Connection = mongoose.createConnection(parameters.uri, opts);
        db.once("open", () => {
            console.log("Connected on mongodb: ", parameters.uri);
        });
        this.connections.set(datasourceKey, db);
        return db;
    }

    getConnection(datasourceKey: string): Connection {
        let c = this.connections.get(datasourceKey);
        if (!c) throw new Error(`Datasource '${datasourceKey}' not registered for mongodb connector. At least one datasource must be defined in your configuration file.`);
        return c;
    }

    createModelFactory(name: string, myClass: any): IModelFactory {
        return new ModelFactory(name, myClass, this);
    }
}