import { _ } from 'streamline-runtime';
import { Connection } from 'mongoose';
// need require for mongoose
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

_.context['mongooseConnections'] = new Map<string, Connection>();

export class ConnectionHelper {
    public static connect (datasourceKey: string, parameters: any): Connection {
        let opts = parameters.options;
        let db: Connection = mongoose.createConnection(parameters.uri, opts);
        db.once("open", () => {
            console.log("Connected on mongodb: ",parameters.uri);
        });
        _.context['mongooseConnections'].set(datasourceKey, db);
        return db;
    }

    public static get(datasourceKey: string): Connection {
        let c = _.context['mongooseConnections'].get(datasourceKey);
        if (!c) throw new Error(`Datasource '${datasourceKey}' not registered. At least one datasource must be defined in your configuration file.`);
        return c;
    }
}