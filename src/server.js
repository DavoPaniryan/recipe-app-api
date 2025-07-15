import express from 'express';
import { ENV } from './config/env.js';

import { db } from './config/db.js';
import { favoritesTable } from './db/schema.js';
import { and, eq } from 'drizzle-orm';

import job from './config/cron.js';

const app = express();
const PORT = ENV.PORT || 8000;

if (ENV.NODE_ENV === 'production') job.start();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json('success');
});

app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, recipeId, title, image, cookTime, servings } = req.body;

        if (!userId || !recipeId || !title) {
            res.status(400).json({ error: 'Missing required fields' });
        }

        const newFavorite = await db
            .insert(favoritesTable)
            .values({
                user_id: userId,
                recipeId: recipeId,
                title,
                image,
                cookTime,
                servings,
            })
            .returning();

        res.status(201).json(newFavorite[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const userFavorites = await db
            .select()
            .from(favoritesTable)
            .where(eq(favoritesTable.user_id, userId));

        res.json(userFavorites);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.delete('/api/favorites/:userId/:recipeId', async (req, res) => {
    try {
        const { userId, recipeId } = req.params;

        await db
            .delete(favoritesTable)
            .where(
                and(
                    eq(favoritesTable.user_id, userId),
                    eq(favoritesTable.recipeId, parseInt(recipeId)),
                ),
            );

        res.status(200).json({ message: 'Deleted successfuly' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(PORT, () => {
    console.log('server is running');
});
