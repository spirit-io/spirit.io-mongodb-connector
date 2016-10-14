import { _ } from 'streamline-runtime';
import { Fixtures } from '../fixtures/setup';

import { ModelA } from '../models';
import { helper as objectHelper } from 'spirit.io/lib/utils';
import { AdminHelper } from 'spirit.io/lib/core';


const expect = require('chai').expect;

const modelsA: any = {
    $properties: ['_id', '_createdAt', '_updatedAt', 'pString', 'pNumber', 'pDate', 'pBoolean', 'aString', 'aNumber', 'aDate', 'aBoolean'],
    $plurals: ['aString', 'aNumber', 'aDate', 'aBoolean'],
    data: {
        m1: {
            pString: "stringA",
            pNumber: 0,
            pDate: new Date(),
            pBoolean: true,
            aString: ["stringA1", "stringA2"],
            aNumber: [1,2],
            aDate: [new Date(), new Date()],
            aBoolean: [true, false]
        }
    }
};

let modelAInstances = [];
let db;

before(function(_) {
    Fixtures.setup(_);
    db = AdminHelper.model(ModelA);
});

/**
 * Unit tests
 */
describe('User Model Unit Tests:', () => {
    
    describe('CRUD validation on simple class', () => {

        it('save modelA instance with valid values should work', (_) => {

            let data = objectHelper.clone(modelsA.data.m1);
            let m1: ModelA = new ModelA();
            db.updateValues(m1, data);
            db.saveInstance(_, m1);
            // store _id to be able to remove all documents at the end
            modelAInstances.push(m1);
            expect(db.serialize(m1)).to.have.all.keys(modelsA.$properties);
           
            let _id = db.getMetadata(m1, '_id');
            let _createdAt = db.getMetadata(m1, '_createdAt');
            
            expect(_id).to.be.a('string');
            expect(_id).to.not.be.null;
            expect(_createdAt).to.be.a('date');
            expect(_createdAt).to.not.null;
            expect(m1.pString).to.be.a('string');
            expect(m1.pString).to.equal(data.pString);
            expect(m1.pNumber).to.be.a('number');
            expect(m1.pNumber).to.equal(data.pNumber);
            expect(m1.pDate).to.be.a('date');
            expect(m1.pDate.getTime()).to.equal(data.pDate.getTime());
            expect(m1.pBoolean).to.be.a('boolean');
            expect(m1.pBoolean).to.equal(data.pBoolean);
        });
        
        it('delete modelA should work', (_) => {
            for (let inst of modelAInstances) {
                let result = db.deleteInstance(_, inst).result;
                expect(result.ok).to.equal(1);
                expect(result.n).to.equal(1);
            }
        });
    });
});