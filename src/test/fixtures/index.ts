import { Server } from 'spirit.io/lib/application';
import { MongodbConnector } from '../../lib/connector';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { devices } from 'f-streams';
import { context } from 'f-promise';

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


function request(method: string, url: string, data?: any, headers?: any) {
    headers = headers || {
        'content-type': 'application/json'
    };
    trace && trace("HTTP " + method + " " + baseUrl + url);
    let cli = devices.http.client({
        url: baseUrl + url,
        method: method,
        headers: headers
    })

    let resp = cli.proxyConnect().end(data != null ? JSON.stringify(data) : undefined).response();

    return {
        status: resp.statusCode,
        headers: resp.headers,
        body: resp.readAll()
    };
}

export class Fixtures {

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

    static get = (url: string, headers?: any) => {
        return request('GET', url, null, headers);
    }

    static post = (url: string, data: any, headers?: any) => {
        return request('POST', url, data, headers);
    }

    static put = (url: string, data: any, headers?: any) => {
        return request('PUT', url, data, headers);
    }

    static delete = (url: string, headers?: any) => {
        return request('DELETE', url, null, headers);
    }

    static patch = (url: string, headers?: any) => {
        return request('PATCH', url, headers);
    }
}





