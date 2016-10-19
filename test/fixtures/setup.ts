require('streamline').register({});
import { _ } from 'streamline-runtime';
import { Server } from 'spirit.io/lib/application';
import { MongodbConnector } from '../../lib/connector';
const flows = require('streamline-runtime').flows;
const path = require('path');
const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    models: {
        "ModelA": {}
    },
    connectors: {
        mongodb: {
            datasources: {
                "mongodb": {uri: "mongodb://localhost:27032/spirit-test", options: {}}
            },
            mongoose: {
                debug: false
            }
        }
    }
};
const cb = function(err, res) {
    if (err) throw err;
    return res;
};

export class Fixtures {

    static setup(_) {

        
        let server: Server = require('spirit.io')(config);
        server.addConnector(new MongodbConnector());
        server.init(_);
        server.start(_, 3001);


        
    }


}