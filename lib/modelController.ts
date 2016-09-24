import { _ } from 'streamline-runtime';
import express = require("express");
import { IController, IModelActions, IModelFactory } from 'spirit.io/lib/interfaces';

export class ModelController implements IController {

    private _actions: IModelActions;
    private _target: any;

    constructor(private modelFactory: IModelFactory) {
        this._actions = modelFactory.actions;
        this._target = modelFactory.targetClass;
    }
    query = (req: express.Request, res: express.Response, _: _): void => {
        let where: string = req.query['where'];
        if (where) {
            try {
                where = JSON.parse(where)
            } catch (err) {
                throw new Error(`Invalid where filter: ${where}`);
            }
        }
        let includes: string = req.query['includes'];
        let result = this._actions.query(_, where, { includes: includes });
        res.json(result);
    }

    read = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let includes: string = req.query['includes'];
        let result = this._actions.read(_, _id, { includes: includes });
        if (!result) res.sendStatus(404);
        else res.json(result);
    }

    create = (req: express.Request, res: express.Response, _: _): void => {
        let item: any = req.body;
        let result = this._actions.create(_, item);
        res.json(result);
    }

    update = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let item: any = req.body;
        let result = this._actions.update(_, _id, item);
        res.json(result);
    }

    delete = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let result = this._actions.delete(_, _id);
        res.json(result);
    }

    executeService = (req: express.Request, res: express.Response, _: _): void => {
        let _name: string = req.params['_name'];
        let result = this._target[_name]();
        res.json(result);
    }

    executeMethod = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let _name: string = req.params['_name'];
        let inst = this.modelFactory.helper.fetchInstance(_, _id);
        if (!inst[_name]) throw new Error(`Method ${_name} does not exist on model ${this.modelFactory.collectionName}`);
        let result = inst[_name]();
        res.json(result);
    }
} 