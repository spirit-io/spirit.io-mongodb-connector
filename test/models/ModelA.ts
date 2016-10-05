import { collection, unique, required, reverse } from 'spirit.io/lib/decorators';
import { ModelBase } from 'spirit.io/lib/base';

@collection()
export class ModelA extends ModelBase {
    @required
    pString: string;
    pNumber: number;
    pDate: Date;
    pBoolean: boolean;

    aString: Array<string>;
    aNumber: Array<number>;
    aDate: Array<Date>;
    aBoolean: Array<boolean>;
}