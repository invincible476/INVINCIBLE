import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertProfileSchema, insertConversationSchema, insertMessageSchema, insertContactSchema } from "@shared/schema";
import { z } from "zod";

// Session middleware setup
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-for-replit-chat-app',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Better for development
    },
    name: 'sessionId', // Custom session name
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const signupSchema = insertUserSchema.extend({
        fullName: z.string().min(1),
        username: z.string().min(1),
      });
      
      const { email, password, fullName, username } = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // Check if username already exists
      const existingProfile = await storage.getProfileByUsername(username);
      if (existingProfile) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Create user and profile in transaction-like manner
      try {
        const user = await storage.createUser({ email, password });
        
        const profile = await storage.createProfile({
          userId: user.id,
          username,
          fullName,
        });
        
        req.session.userId = user.id;
        
        res.json({ 
          user: { 
            id: user.id, 
            email: user.email 
          } 
        });
      } catch (profileError) {
        // If profile creation fails, clean up the user
        await storage.deleteUser(user.id);
        throw profileError;
      }
      
    } catch (error) {
      console.error("Signup error:", error);
      if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        res.status(400).json({ error: "Username or email already taken" });
      } else {
        res.status(400).json({ error: "Registration failed. Please try again." });
      }
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isValid = await storage.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email 
        } 
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not sign out" });
      }
      res.json({ message: "Signed out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById(req.session.userId);
      const profile = await storage.getProfileByUserId(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email 
        },
        profile 
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.session.userId!);
      res.json(profile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const updateData = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(req.session.userId!, updateData);
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(req.session.userId!);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({
        ...conversationData,
        createdBy: req.session.userId!,
      });
      
      // Add creator as participant
      await storage.addUserToConversation(conversation.id, req.session.userId!);
      
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessagesByConversationId(id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const messageData = insertMessageSchema.parse(req.body);
      
      const message = await storage.createMessage({
        ...messageData,
        conversationId: id,
        senderId: req.session.userId!,
      });
      
      // Note: Real-time broadcasting would go here in production
      // For now, clients will refetch via polling or manual refresh
      
      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contact routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContactsByUserId(req.session.userId!);
      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...contactData,
        userId: req.session.userId!,
      });
      res.json(contact);
    } catch (error) {
      console.error("Create contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Note: WebSocket setup for real-time messaging is commented out to avoid conflicts with Vite
  // In production, you can enable this for real-time features
  /*
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws: any) => {
    console.log('WebSocket client connected');
    // WebSocket logic here
  });
  */

  return httpServer;
}
