//require('streamline').register({});
import { _ } from 'streamline-runtime';
import { Server } from 'spirit.io/lib/application';
import { MongodbConnector } from '../../lib/connector';
import { ConnectorHelper } from 'spirit.io/lib/core';
import { devices } from 'ez-streams';
const path = require('path');

let trace;// = console.log;

const port = 3001;
const baseUrl = 'http://localhost:' + port;

const config = {
    modelsLocation: path.resolve(path.join(__dirname, '../models')),
    connectors: {
        mongodb: {
            datasources: {
                "mongodb": {
                    uri: "mongodb://localhost:27032/spirit",
                    options: {}
                }
            },
            mongoose: {
                debug: false
            }
        }
    }

};


function request(_: _, method: string, url: string, data?: any, headers?: any) {
    headers = headers || {
        'content-type': 'application/json'
    };
    trace && trace("HTTP " + method + " " + baseUrl + url);
    let cli = devices.http.client({
        url: baseUrl + url,
        method: method,
        headers: headers
    })

    let resp;
    if (data != null) {
        resp = cli.end(JSON.stringify(data)).response(_);
    } else {
        resp = cli.end().response(_);
    }
    return {
        status: resp.statusCode,
        headers: resp.headers,
        body: resp.readAll(_)
    };
}

export class Fixtures {

    static setup = (_, done) => {
        let firstSetup = true;
        let connector;
        if (!_.context.__server) {
            let server: Server = _.context.__server = require('spirit.io')(config);
            server.on('initialized', function () {
                console.log("========== Server initialized ============\n");
                done();
            });
            console.log("\n========== Initialize server begins ============");
            connector = new MongodbConnector();
            server.addConnector(connector);
            console.log("Connector config: " + JSON.stringify(connector.config, null, 2));
            server.init(_);
            server.start(_, port);
        } else {
            firstSetup = false;
            connector = <MongodbConnector>ConnectorHelper.getConnector('mongodb');

        }
        //

        //
        if (!firstSetup) done();
        return _.context.__server;
    }

    static get = (_: _, url: string, headers?: any) => {
        return request(_, 'GET', url, null, headers);
    }

    static post = (_: _, url: string, data: any, headers?: any) => {
        return request(_, 'POST', url, data, headers);
    }

    static put = (_: _, url: string, data: any, headers?: any) => {
        return request(_, 'PUT', url, data, headers);
    }

    static delete = (_: _, url: string, headers?: any) => {
        return request(_, 'DELETE', url, null, headers);
    }

    static patch = (_: _, url: string, headers?: any) => {
        return request(_, 'PATCH', url, headers);
    }

    static execAsync = (done, fn): void => {
        fn(function (err, res) {
            if (err) done(err);
            else done();
        });
    }
}





