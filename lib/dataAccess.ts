"use sctrict";

// need require for mongoose
import { Connection } from 'mongoose';
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

export class DataAccess {
    static mongooseInstance: any;
    static mongooseConnection: Connection;
    static connected: boolean;
    public static connect (db: string): Connection {
        if(this.mongooseInstance) return this.mongooseInstance;
        
        this.mongooseConnection  = mongoose.connection;
        this.mongooseConnection.once("open", () => {
            console.log("Connected on mongodb: "+db);
            this.connected = true;
        });
        
        this.mongooseInstance = mongoose.connect(db);
        return this.mongooseInstance;
    }


}