import { IConnector, IModelFactory } from 'spirit.io/lib/interfaces'
import { DataAccess } from './dataAccess';
import { ModelFactory } from './modelFactory';
import { Connection } from 'mongoose';

export class MongodbConnector implements IConnector {
    connect = (db: string): any => {
        DataAccess.connect(db);
    }

    createModelFactory = (myClass: any): IModelFactory => {
        return new ModelFactory(myClass);
    }

}