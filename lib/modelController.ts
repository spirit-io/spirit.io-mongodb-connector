import { _ } from 'streamline-runtime';
import express = require("express");
import { IModelController, IModelActions, IModelFactory } from 'spirit.io/lib/interfaces';
import { ModelControllerBase } from 'spirit.io/lib/base';
import { SchemaHelper } from './SchemaHelper';
import { Model } from 'mongoose';

export class ModelController extends ModelControllerBase implements IModelController {
    constructor(modelFactory: IModelFactory) {
        super(modelFactory);
    }

} 