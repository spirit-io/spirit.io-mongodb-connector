import { Connection } from 'mongoose';
import { context } from 'f-promise';
// need require for mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

context()['mongooseConnections'] = new Map<string, Connection>();

export class ConnectionHelper {
    public static connect(datasourceKey: string, parameters: any): Connection {
        let opts = parameters.options;
        let db: Connection = mongoose.createConnection(parameters.uri, opts);
        db.once("open", () => {
            console.log("Connected on mongodb: ", parameters.uri);
        });
        context()['mongooseConnections'].set(datasourceKey, db);
        return db;
    }

    public static get(datasourceKey: string): Connection {
        let c = context()['mongooseConnections'].get(datasourceKey);
        if (!c) throw new Error(`Datasource '${datasourceKey}' not registered. At least one datasource must be defined in your configuration file.`);
        return c;
    }
}