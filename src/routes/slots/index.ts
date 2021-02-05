import {Request, Response} from 'express';

import slotsService from '../../services/slots';
import {DBErrorType} from './../../errors';
import {ISlotData} from '../../models/slots';

const get = (req: Request, res: Response): void => {
    const {offset, limit} = req.query;
    
    slotsService.getSlots(offset as string, limit as string)
        .then((result: ISlotData[]) => res.status(200).send(result))
        .catch((err: DBErrorType | Error) => res.status(500).send({error: err.message}));
};

const patchId = (req: Request, res: Response): void => {
    const {id} = req.params;
    const {time} = req.body;

    slotsService.selectSlot(id, time)
        .then((result: ISlotData[]) => res.status(200).send(result))
        .catch((err: DBErrorType | Error) => res.status(500).send({error: err.message}));

};

const patch = (req: Request, res: Response): void => {
    slotsService.selectSpecialDelivery()
        .then((result: ISlotData[]) => res.status(200).send(result))
        .catch((err: DBErrorType | Error) => res.status(500).send({error: err.message}));
};

export default {
    get,
    patch,
    patchId
};
