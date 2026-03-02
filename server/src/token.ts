import jwt from 'jsonwebtoken';
import type { Response } from 'express';

export const accessToken = (userId: number) => jwt.sign(
    {userId}, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });

export const refreshToken = (userId: number) => jwt.sign(
    {userId}, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' }
)

export const sendAccessToken = (res: Response, accessToken: string) => {
    res.json({accessToken});
};

export const sendRefreshToken = (res: Response, refreshToken: string) => {
    res.cookie('refreshToken', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // Set to true in production with HTTPS
    });
}