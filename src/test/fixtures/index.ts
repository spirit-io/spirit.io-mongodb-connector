import { Server } from 'spirit.io/lib/application';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { MongodbConnector } from '../../lib/connector';
import { context, run } from 'f-promise';
import { Fixtures as GlobalFixtures } from 'spirit.io/test/fixtures';
import * as path from 'path';

const port = 3001;
const mongodbPort = process.env.SPIRIT_MONGODB_PORT || 27017;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mongodb: {
            datasources: {
                "mongodb": {
                    uri: "mongodb://localhost:" + mongodbPort + "/spirit",
                    options: {},
                    autoConnect: true
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
        function reset() {
            // delete the whole database
            let mConnector: MongodbConnector = <MongodbConnector>ConnectorHelper.getConnector('mongodb');
            Fixtures.cleanDatabases([mConnector]);
        }
        let connector;
        if (!context().__server) {
            let server: Server = context().__server = new Server(config);

            server.on('initialized', function () {
                run(() => {
                    console.log("========== Server initialized ============\n");
                    // delete the whole database
                    reset();
                    server.start(port);
                }).catch(err => {
                    done(err);
                });
            });

            server.on('started', function () {
                run(() => {
                    console.log("========== Server started ============\n");
                    done();
                }).catch(err => {
                    done(err);
                });
            });

            run(() => {
                console.log("\n========== Initialize server begins ============");
                connector = new MongodbConnector(config.connectors.mongodb);
                server.addConnector(connector);
                console.log("Connector config: " + JSON.stringify(connector.config, null, 2));

                server.init();
            }).catch(err => {
                done(err);
            });
        } else {
            run(() => {
                reset();
                done();
            }).catch(err => {
                done(err);
            });
        }
        //

        //
        return context().__server;
    }
}





