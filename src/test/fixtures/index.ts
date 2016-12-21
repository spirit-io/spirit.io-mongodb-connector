import { Server } from 'spirit.io/lib/application';
import { MongodbConnector } from '../../lib/connector';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { devices } from 'f-streams';
import { context } from 'f-promise';
import { Fixtures as GlobalFixtures } from 'spirit.io/test/fixtures';

const path = require('path');

let trace;// = console.log;

const port = 3001;
const mongodbPort = process.env.SPIRIT_MONGODB_PORT || 27017;
const baseUrl = 'http://localhost:' + port;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mongodb: {
            datasources: {
                "mongodb": {
                    uri: "mongodb://localhost:" + mongodbPort + "/spirit",
                    options: {}
                }
            },
            mongoose: {
                debug: false
            }
        }
    }

};

export class Fixtures extends GlobalFixtures {

    static setup = (done) => {
        let firstSetup = true;
        let connector;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);
            server.on('initialized', function () {
                console.log("========== Server initialized ============\n");
                done();
            });
            console.log("\n========== Initialize server begins ============");
            connector = new MongodbConnector(config.connectors.mongodb);
            server.addConnector(connector);
            console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
            server.init();
            server.start(port);
        } else {
            firstSetup = false;
            connector = <MongodbConnector>ConnectorHelper.getConnector('mongodb');

        }
        //

        //
        if (!firstSetup) done();
        return context().__server;
    }
}





