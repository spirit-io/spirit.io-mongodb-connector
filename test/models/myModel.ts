import { collection, unique, required, index, reverse, embedded } from 'spirit.io/lib/decorators';
import { ModelBase } from 'spirit.io/lib/base';

@collection({ datasource: 'mock:ds' })
export class MyModelRel extends ModelBase {
    constructor(data) {
        super(data);
    }
    p1: string
    relinv: MyModel;
    relinvs: MyModel[]
}

@collection()
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

    aMethod(_, params: any): string {
        this.pString = params.pString;
        this.save(_);
        return `aMethod has been called with parameters ${JSON.stringify(params)}`;
    }

    static aService(_, params: any): any {
        return { c: (params.a + params.b).toFixed(2) };
    }
}

