import jwt from 'jsonwebtoken';
import type {Request} from 'express';

export const isAuth = (req: Request) => {
    const authorization = req.headers['authorization'];
    if (!authorization) {
        throw new Error('Not authenticated');
    }
    const token = authorization.split(' ')[1];
    if(!token) {
        throw Error('no Token');
    }
    const {userId}: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    return userId;
};