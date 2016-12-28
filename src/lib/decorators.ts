import * as helpers from 'spirit.io/lib/decorators/helpers';

/**
 * Allows to set `unique` metadata on mongoose schema property.
 * This would add the capability on the property to be unique using mongoose-unique-validator.
 * See https://www.npmjs.com/package/mongoose-unique-validator for details.
 * @param any The prototype of the class.
 * @param string The name of the property.
 */
export function unique(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { unique: true });
}

/**
 * Allows to set `index` metadata on mongoose schema property.
 * This would add a secondary index on Mongodb collection for this property.
 * See http://mongoosejs.com/docs/guide.html#indexes for details.
 * @param any The prototype of the class.
 * @param string The name of the property.
 */
export function index(target: any, propertyKey: string) {
    helpers.addMetadata(target.constructor, propertyKey, { index: true });
}