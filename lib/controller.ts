
import { _ } from 'streamline-runtime';
import express = require("express");
import mongoose = require("mongoose");
import { IController, IModelActions } from 'spirit.io/lib/interfaces';

export class Controller implements IController {

    constructor(private actions: IModelActions) { }

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
        let result = this.actions.query(_, where, { includes: includes });
        res.json(result);
    }

    read = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let includes: string = req.query['includes'];
        let result = this.actions.read(_, _id, { includes: includes });
        if (!result) res.sendStatus(404);
        else res.json(result);
    }

    create = (req: express.Request, res: express.Response, _: _): void => {
        let item: any = req.body;
        let result = this.actions.create(_, item);
        res.json(result);
    }

    update = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let item: any = req.body;
        let result = this.actions.update(_, _id, item);
        res.json(result);
    }

    delete = (req: express.Request, res: express.Response, _: _): void => {
        let _id: string = req.params['_id'];
        let result = this.actions.delete(_, _id);
        res.json(result);
    }
} 