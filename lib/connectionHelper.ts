import { Connection } from 'mongoose';
// need require for mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var globals = require('streamline-runtime').globals;
globals.context.mongooseConnections = new Map<string, Connection>();

export class ConnectionHelper {
    public static connect (datasourceKey: string, parameters: any): Connection {
        let opts = parameters.options;
        let db: Connection = mongoose.createConnection(parameters.uri, opts);
        db.once("open", () => {
            console.log("Connected on mongodb: ",parameters.uri);
        });
        globals.context.mongooseConnections.set(datasourceKey, db);
        return db;
    }

    public static get(datasourceKey: string): Connection {
        let c = globals.context.mongooseConnections.get(datasourceKey);
        if (!c) throw new Error(`Datasource ${datasourceKey} not registered.`);
        return c;
    }
}