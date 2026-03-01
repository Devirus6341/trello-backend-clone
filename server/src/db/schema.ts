import { relations } from "drizzle-orm";
import { pgTable, pgEnum, integer, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  boardId: integer("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  priority: priorityEnum("priority").default("low"),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listId: integer("list_id").notNull().references(() => lists.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});


//RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  cards: many(cards)
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
    user: one(users, { 
        fields: [workspaces.userId], 
        references: [users.id] }),
    boards: many(boards)
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
    workspace: one(workspaces, { 
        fields: [boards.workspaceId], 
        references: [workspaces.id] }),
    lists: many(lists)
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
    board: one(boards, { 
        fields: [lists.boardId], 
        references: [boards.id] }),
    cards: many(cards)
}));

export const cardsRelations = relations(cards, ({ one }) => ({
    list: one(lists, { 
        fields: [cards.listId], 
        references: [lists.id] }),
        user: one(users, {
            fields: [cards.userId],
            references: [users.id]
        })
}));
