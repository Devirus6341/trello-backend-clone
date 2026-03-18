import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import {db} from './db.js';
import { accessToken, refreshToken, sendAccessToken, sendRefreshToken } from './token.js';
import bcrypt from 'bcryptjs';
import {isAuth} from './auth.js';
import { users, workspaces, boards, lists, cards } from './db/schema.js';
import { eq } from 'drizzle-orm';


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
    const refresh =  refreshToken(user.id);
    const access =  accessToken(user.id);

    await db.update(users).set({
       refreshToken: refresh
    }).where(eq(users.id, user.id));

         sendRefreshToken(res, refresh);
      sendAccessToken(res, access);
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

        if (!user || user.refreshToken !== token) return res.json({ accessToken: "" });
        const access = accessToken(user.id);
        const refresh = refreshToken(user.id);
            await db.update(users).set({
            refreshToken: refresh
        }).where(eq(users.id, user.id));
        sendRefreshToken(res, refresh);
        sendAccessToken(res, access);


    } catch (err) {
        return res.json({ accessToken: "" });
    }
});

app.get('/workspaces', async (req: Request, res: Response) => {
    const userId = isAuth(req);
    if (!userId) 
        return res.status(401).json({ error: "Not authenticated" });
    const result = await db.select().from(workspaces).where(eq(workspaces.userId, userId));
        res.json({ result });
});

app.post('/workspaces', async (req: Request, res: Response) => {
     const userId = isAuth(req);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const {title} = req.body;

        const [result] = await db.insert(workspaces).values(
            {name: title, userId},
        ).returning();
        res.json(result);
});
app.get('/boards', async (req: Request, res: Response) => {
    const userId = isAuth(req);
    if (!userId) 
        return res.status(401).json({ error: "Not authenticated" });
    const result = await db.select().from(boards).where(eq(boards.workspaceId, workspaces.id));
    res.json({ result });
});
app.post('/boards', async (req: Request, res: Response) => {
    const userId = isAuth(req);
        if (!userId)
            return res.status(401).json({ error: "Not authenticated" });
        const {title, workspaceId} = req.body;

        const [result] = await db.insert(boards).values(
            {name: title, workspaceId},
        ).returning();
        res.json(result);
});
app.get('/lists', async (req: Request, res: Response) => {
    const userId = isAuth(req);
    if (!userId) 
        return res.status(401).json({ error: "Not authenticated" });
    const result = await db.select().from(lists).where(eq(lists.boardId, boards.id));
    res.json({ result });
});
app.post('/lists', async (req: Request, res: Response) => {});
app.get('/cards', async (req: Request, res: Response) => {
    const userId = isAuth(req);
    if (!userId) 
        return res.status(401).json({ error: "Not authenticated" });
    const result = await db.select().from(cards).where(eq(cards.listId, lists.id));
    res.json({ result });
});
app.post('/cards', async (req: Request, res: Response) => {});


app.listen(port, () => {
  console.log(` Server ready at http://localhost:${port}`);
});