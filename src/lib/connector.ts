import { IConnector, IModelFactory, IValidator } from 'spirit.io/lib/interfaces';
import { ModelFactory } from './modelFactory';
import { Connection } from 'mongoose';
import { wait } from 'f-promise';
import * as mongoose from 'mongoose';
(<any>mongoose).Promise = global.Promise;

export class MongodbConnector implements IConnector {
    private _datasource: string = 'mongodb';
    private _config: any;
    public ignoreValidators: string[] = ['required', 'unique', 'index', 'sparse'];
    public connections = new Map<string, Connection>();
    public validators: Map<string, IValidator> = new Map();

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

    connect(datasourceKey: string): any {
        let parameters = this.config.datasources[datasourceKey];
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
        if (!c) throw new Error(`Connection for '${datasourceKey}' datasource not registered for mongodb connector. At least one datasource must be defined in your configuration file. Please check 'connect' function has been called or 'autoConnect' flag is set to 'true' in the datasource configuration`);
        return c;
    }

    cleanDb(ds: string): void {
        wait(this.getConnection(ds).dropDatabase());
    }

    createModelFactory(name: string, myClass: any, options?: any): IModelFactory {
        return new ModelFactory(name, myClass, this, options);
    }

    registerValidator(validator: IValidator) {
        this.validators.set(validator.name, validator);
    }

    getValidator(key: string): IValidator {
        return this.validators.get(key);
    }
}