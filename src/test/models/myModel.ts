import { model, required, reverse, embedded } from 'spirit.io/lib/decorators';
import { unique, index } from '../../lib/decorators';
import { ModelBase } from 'spirit.io/lib/base';

@model()
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }
    @unique
    @required
    p1: string
    @unique
    p2: string
    relinv: MyModel;
    relinvs: MyModel[]
}

@model()
export class MyModel extends ModelBase {
    constructor() {
        super();
    }
    @required
    @required // twice for coverage
    pString: string;

    @unique
    pNumber: number;

    @index
    pDate: Date;

    pBoolean: boolean;

    @required
    aString: Array<String>;

    aNumber: Array<number>;
    aDate: Array<Date>;
    aBoolean: Array<boolean>;

    @embedded
    rel: MyModelRel;
    rels: MyModelRel[];

    @reverse('relinv')
    inv: MyModelRel;

    @reverse('relinvs')
    invs: MyModelRel[];

    aMethod(params: any): string {
        this.pString = params.pString;
        this.save();
        return `aMethod has been called with parameters ${JSON.stringify(params)}`;
    }

    static aService(params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }


}

