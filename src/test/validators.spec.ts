import { Fixtures } from './fixtures';
import { Server } from 'spirit.io/lib/application';
import { MyModelRel } from './models/myModel';
import { setup } from 'f-mocha';

import * as chai from 'chai';
const expect = chai.expect;

// this call activates f-mocha wrapper.
setup();

let server: Server;

function expectPropertyRequired(data: any, name: string) {
    expect(data).to.be.not.undefined;
    expect(data.$diagnoses).to.be.not.null;
    expect(data.$diagnoses.length).to.be.equal(1);
    expect(data.$diagnoses[0].$severity).to.be.equal('error');
    expect(data.$diagnoses[0].$message).to.be.equal(`ValidatorError: Path \`${name}\` is required.`);
    expect(data.$diagnoses[0].$stack).to.be.not.null;
}

function expectPropertyUnique(data: any, name: string, value: string) {
    expect(data).to.be.not.undefined;
    expect(data.$diagnoses).to.be.not.null;
    expect(data.$diagnoses.length).to.be.equal(1);
    expect(data.$diagnoses[0].$severity).to.be.equal('error');
    expect(data.$diagnoses[0].$message).to.be.equal(`ValidatorError: Error, expected \`${name}\` to be unique. Value: \`${value}\``);
    expect(data.$diagnoses[0].$stack).to.be.not.null;
}

describe('*** MongoDB connector validators Tests ***', () => {

    before(function (done) {
        this.timeout(10000);
        server = Fixtures.setup(done);
    });

    describe('* MongoDB connector `required` validator using ORM:', () => {
        it('should reject create operation with missing required property value', () => {
            let mRel1: MyModelRel;
            let e;
            try {
                mRel1 = new MyModelRel({});
                mRel1.save();
            } catch (err) {
                e = err;
            } finally {
                expectPropertyRequired(e, 'p1');
            }
        });

        it('should reject update operation with missing required property value', () => {
            let e;
            try {
                new MyModelRel({ p1: null }).save();
            } catch (err) {
                e = err;
            } finally {
                expectPropertyRequired(e, 'p1');
            }
        });
    });

    describe('* MongoDB connector `required` validator using REST API:', () => {
        it('should reject POST request with missing required property value', () => {
            let resp = Fixtures.post('/api/v1/myModelRel', {});
            let body = JSON.parse(resp.body);
            expectPropertyRequired(body, 'p1');
        });

        it('should reject PUT request with missing required property value', () => {

            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "prop1" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            resp = Fixtures.put('/api/v1/myModelRel/' + id, { p1: null });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expectPropertyRequired(body, 'p1');
        });

        it('should reject PATCH request with missing required property value', () => {

            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "prop2", p2: "prop2" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            resp = Fixtures.patch('/api/v1/myModelRel/' + id, { p1: null });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expectPropertyRequired(body, 'p1');
        });
    });

    describe('* MongoDB connector `unique` validator using ORM:', () => {
        it('Unique validator should reject create operation with already existing properties value', () => {

            let mRel1: MyModelRel;
            let e;
            // use array for expected verification as the order could vary
            let expectedMessages = [
                'ValidatorError: Error, expected `p1` to be unique. Value: `prop1`',
                'ValidatorError: Error, expected `p2` to be unique. Value: `prop2`'
            ]
            try {
                mRel1 = new MyModelRel({ p1: "prop1", p2: 'prop2' });
                mRel1.save();
            } catch (err) {
                e = err;
            } finally {
                expect(e.$diagnoses).to.be.not.null;
                expect(e.$diagnoses.length).to.be.equal(2);
                expect(e.$diagnoses[0].$severity).to.be.equal('error');
                expect(expectedMessages.indexOf(e.$diagnoses[0].$message) !== -1).to.be.true;
                expect(e.$diagnoses[0].$stackTrace).to.be.not.null;
                expect(e.$diagnoses[1].$severity).to.be.equal('error');
                expect(expectedMessages.indexOf(e.$diagnoses[1].$message) !== -1).to.be.true;
                expect(e.$diagnoses[1].$stackTrace).to.be.not.null;
            }
        });

        it('Unique validator should reject update operation with already existing properties value', () => {
            let mRel1: MyModelRel = new MyModelRel({ p1: "value1" });;
            let e;
            try {
                mRel1.save({ p1: null });
            } catch (err) {
                e = err;
            } finally {
                expectPropertyRequired(e, 'p1');
            }
        });
    });

    describe('* MongoDB connector `unique` validator using REST API:', () => {
        it('should reject POST request with missing required property value', () => {
            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "prop1" });
            let body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expectPropertyUnique(body, 'p1', 'prop1');
        });

        it('should reject PUT request with missing required property value', () => {
            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "propUnique1" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            resp = Fixtures.put('/api/v1/myModelRel/' + id, { p1: "prop1" });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expectPropertyUnique(body, 'p1', 'prop1');
        });

        it('should reject PATCH request with missing required property value', () => {
            let resp = Fixtures.post('/api/v1/myModelRel', { p1: "propUnique2" });
            expect(resp.status).to.equal(201);
            let body = JSON.parse(resp.body);
            let id = body._id;

            // use array for expected verification as the order could vary
            let expectedMessages = [
                'ValidatorError: Error, expected `p1` to be unique. Value: `prop1`',
                'ValidatorError: Error, expected `p2` to be unique. Value: `prop2`'
            ]
            resp = Fixtures.patch('/api/v1/myModelRel/' + id, { p1: "prop1", p2: "prop2" });
            body = JSON.parse(resp.body);
            expect(resp.status).to.equal(500);
            expect(body.$diagnoses).to.be.not.null;
            expect(body.$diagnoses.length).to.be.equal(2);
            expect(body.$diagnoses[0].$severity).to.be.equal('error');
            expect(expectedMessages.indexOf(body.$diagnoses[0].$message) !== -1).to.be.true;
            expect(body.$diagnoses[0].$stackTrace).to.be.not.null;
            expect(body.$diagnoses[1].$severity).to.be.equal('error');
            expect(expectedMessages.indexOf(body.$diagnoses[1].$message) !== -1).to.be.true;
            expect(body.$diagnoses[1].$stackTrace).to.be.not.null;
        });
    });

});