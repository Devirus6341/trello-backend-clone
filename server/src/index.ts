import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import {db} from './db.js';
import { accessToken, refreshToken, sendAccessToken, sendRefreshToken } from './token.js';
import bcrypt from 'bcryptjs';
import {isAuth} from './auth.js';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors({ 
  origin: 'http://localhost:5173', // Your Vite/Frontend URL
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 5000;

app.post('/register', async(req: Request, res: Response) => {
const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({
            username,
            email,
            passwordHash: hashedPassword
        });
        res.status(201).json({ message: "User created!" });
    } catch (err) {
        res.status(400).json({ error: "Username or Email already exists" });
    }
});

app.post('/login', async(req: Request, res: Response) => {
const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) return res.status(401).json({ error: "Username not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    // Send tokens
    const refresh = refreshToken(user.id);
    const access = accessToken(user.id);

    sendAccessToken(res, access);
    sendRefreshToken(res, refresh);
});

app.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/' });
    return res.json({ message: "Logged out" });
});


app.post('/refresh-token', async(req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
    if (!token) return res.json({ accessToken: "" });

    try {
        const payload: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

        if (!user) return res.json({ accessToken: "" });

        return res.json({ accessToken: accessToken(user.id) });
    } catch (err) {
        return res.json({ accessToken: "" });
    }
});

app.listen(port, () => {
  console.log(` Server ready at http://localhost:${port}`);
});