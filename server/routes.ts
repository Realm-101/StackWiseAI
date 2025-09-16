import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { generateBusinessIdeas } from "./gemini";
import { insertUserToolSchema, insertSavedIdeaSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Import tools from CSV on startup
  await importToolsFromCSV();

  // Tools routes
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  // User tools routes
  app.get("/api/user-tools", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userTools = await storage.getUserTools(req.user!.id);
      res.json(userTools);
    } catch (error) {
      console.error("Error fetching user tools:", error);
      res.status(500).json({ message: "Failed to fetch user tools" });
    }
  });

  app.post("/api/user-tools", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userToolData = insertUserToolSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Check if user already has this tool
      const existingUserTool = await storage.getUserToolByToolId(req.user!.id, userToolData.toolId);
      if (existingUserTool) {
        return res.status(400).json({ message: "Tool already added to your stack" });
      }

      const userTool = await storage.addUserTool(userToolData);
      res.status(201).json(userTool);
    } catch (error) {
      console.error("Error adding user tool:", error);
      res.status(500).json({ message: "Failed to add tool to stack" });
    }
  });

  app.put("/api/user-tools/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updates = insertUserToolSchema.partial().parse(req.body);
      const userTool = await storage.updateUserTool(req.params.id, updates);
      
      if (!userTool) {
        return res.status(404).json({ message: "User tool not found" });
      }

      res.json(userTool);
    } catch (error) {
      console.error("Error updating user tool:", error);
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  app.delete("/api/user-tools/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.removeUserTool(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user tool:", error);
      res.status(500).json({ message: "Failed to remove tool" });
    }
  });

  // AI Ideas routes
  app.post("/api/generate-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { selectedTools, goals } = req.body;
      
      if (!selectedTools || !Array.isArray(selectedTools) || selectedTools.length === 0) {
        return res.status(400).json({ message: "Please select at least one tool" });
      }

      const ideas = await generateBusinessIdeas(selectedTools, goals);
      res.json(ideas);
    } catch (error) {
      console.error("Error generating ideas:", error);
      res.status(500).json({ message: "Failed to generate business ideas" });
    }
  });

  // Saved ideas routes
  app.get("/api/saved-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const ideas = await storage.getSavedIdeas(req.user!.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching saved ideas:", error);
      res.status(500).json({ message: "Failed to fetch saved ideas" });
    }
  });

  app.post("/api/saved-ideas", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const ideaData = insertSavedIdeaSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const idea = await storage.createSavedIdea(ideaData);
      res.status(201).json(idea);
    } catch (error) {
      console.error("Error saving idea:", error);
      res.status(500).json({ message: "Failed to save idea" });
    }
  });

  app.delete("/api/saved-ideas/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.deleteSavedIdea(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting saved idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function importToolsFromCSV() {
  try {
    const csvPath = path.resolve(process.cwd(), "attached_assets", "tools (1)_1758015589276.csv");
    
    if (!fs.existsSync(csvPath)) {
      console.log("Tools CSV file not found, skipping import");
      return;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
    
    const tools = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line handling quoted values
      const values = [];
      let current = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= headers.length) {
        const tool = {
          id: values[0].replace(/"/g, ""),
          name: values[1].replace(/"/g, ""),
          description: values[2].replace(/"/g, ""),
          category: values[3].replace(/"/g, ""),
          url: values[4].replace(/"/g, ""),
          frameworks: values[5].replace(/"/g, ""),
          languages: values[6].replace(/"/g, ""),
          features: values[7].replace(/"/g, ""),
          integrations: values[8].replace(/"/g, ""),
          maturityScore: values[9].replace(/"/g, "") || null,
          popularityScore: values[10].replace(/"/g, "") || null,
          pricing: values[11].replace(/"/g, ""),
          notes: values[12].replace(/"/g, ""),
        };
        
        tools.push(tool);
      }
    }
    
    await storage.importTools(tools);
    console.log(`Imported ${tools.length} tools from CSV`);
  } catch (error) {
    console.error("Error importing tools from CSV:", error);
  }
}
