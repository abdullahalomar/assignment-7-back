const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("assignment7");
    const collection = db.collection("users");
    const clothCollection = db.collection("cloths");
    const testimonialCollection = db.collection("testimonials");
    const commentCollection = db.collection("comments");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // Get all users
    app.get("/api/v1/users", async (req, res) => {
      try {
        const users = await collection.find({}).toArray();
        res.json({
          success: true,
          data: users,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching users",
        });
      }
    });

    // Get a single user by ID
    app.get("/api/v1/users/:id", async (req, res) => {
      const userId = req.params.id;

      try {
        const user = await collection.findOne({
          _id: new ObjectId(userId),
        });

        if (user) {
          res.json({
            success: true,
            data: user,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "User not found",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching user",
        });
      }
    });

    // ==============================================================
    // Cloth Post Operation
    app.post("/api/v1/create-winter-clothes", async (req, res) => {
      const { image, category, title, size, description } = req.body;
      console.log(req.body);
      try {
        // Insert cloth into the cloth collection
        const result = await clothCollection.insertOne({
          image,
          category,
          title,
          size,
          description,
        });
        console.log(result);

        res.status(201).json({
          success: true,
          message: "Cloth added successfully",
        });
      } catch (error) {
        console.error("Error adding cloth:", error);
        res.status(500).json({
          success: false,
          message: "Error adding cloth",
        });
      }
    });

    // Get all cloths

    app.get("/api/v1/winter-clothes", async (req, res) => {
      try {
        const cloths = await clothCollection.find({}).toArray();
        res.json({
          success: true,
          data: cloths,
        });
      } catch (error) {
        console.error("Error fetching cloths:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching cloths",
        });
      }
    });

    // Cloth Delete Operation
    app.delete("/api/v1/winter-clothes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await clothCollection.deleteOne(query, { new: true });
      res.send(result);
    });

    // Get a single cloth item by ID
    app.get("/api/v1/winter-clothes/:id", async (req, res) => {
      const clothId = req.params.id;

      try {
        const cloth = await clothCollection.findOne({
          _id: new ObjectId(clothId),
        });

        if (cloth) {
          res.json({
            success: true,
            data: cloth,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Cloth not found",
          });
        }
      } catch (error) {
        console.error("Error fetching cloth:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching cloth",
        });
      }
    });

    // Cloth Update Operation
    app.put("/api/v1/winter-clothes/:id", async (req, res) => {
      const clothId = req.params.id;
      const { title, description, image, category, size } = req.body;

      try {
        const filter = { _id: new ObjectId(clothId) };
        const updateDoc = {
          title,
          description,
          image,
          category,
          size,
        };

        const result = await clothCollection.replaceOne(filter, updateDoc, {
          new: true,
        });

        if (result.modifiedCount === 1) {
          res.json({
            success: true,
            message: "Cloth updated successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Cloth not found",
          });
        }
      } catch (error) {
        console.error("Error updating cloth:", error);
        res.status(500).json({
          success: false,
          message: "Error updating cloth",
        });
      }
    });

    // Add Testimonial
    app.post("/api/v1/create-testimonial", async (req, res) => {
      const { image, name, location, contributionDate, description } = req.body;
      console.log(req.body);
      try {
        const result = await testimonialCollection.insertOne({
          image,
          name,
          location,
          contributionDate,
          description,
        });
        console.log(result);

        res.status(201).json({
          success: true,
          message: "testimonial added successfully",
        });
      } catch (error) {
        console.error("Error adding testimonial:", error);
        res.status(500).json({
          success: false,
          message: "Error adding testimonial",
        });
      }
    });

    // Get all Testimonials
    app.get("/api/v1/testimonials", async (req, res) => {
      try {
        const testimonials = await testimonialCollection.find({}).toArray();
        res.json({
          success: true,
          data: testimonials,
        });
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching testimonials",
        });
      }
    });

    // Get a single testimonial item
    app.get("/api/v1/testimonials/:id", async (req, res) => {
      const testimonialId = req.params.id;

      try {
        const testimonial = await testimonialCollection.findOne({
          _id: new ObjectId(testimonialId),
        });

        if (testimonial) {
          res.json({
            success: true,
            data: testimonial,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Testimonial not found",
          });
        }
      } catch (error) {
        console.error("Error fetching testimonial:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching testimonial",
        });
      }
    });

    // Testimonial Update Operation
    app.put("/api/v1/testimonials/:id", async (req, res) => {
      const testimonialId = req.params.id;
      const { image, name, location, contributionDate, description } = req.body;

      try {
        const filter = { _id: new ObjectId(testimonialId) };
        const updateDoc = {
          image,
          name,
          location,
          contributionDate,
          description,
        };

        const result = await testimonialCollection.replaceOne(
          filter,
          updateDoc,
          {
            new: true,
          }
        );

        if (result.modifiedCount === 1) {
          res.json({
            success: true,
            message: "Testimonial updated successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Testimonial not found",
          });
        }
      } catch (error) {
        console.error("Error updating Testimonial:", error);
        res.status(500).json({
          success: false,
          message: "Error updating Testimonial",
        });
      }
    });

    // Delete Testimonials
    app.delete("/api/v1/testimonials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await testimonialCollection.deleteOne(query, {
        new: true,
      });
      res.send(result);
    });

    // Comment Post Operation
    app.post("/api/v1/create-comment", async (req, res) => {
      const { name, description } = req.body;
      console.log(req.body);
      try {
        // Insert cloth into the cloth collection
        const result = await commentCollection.insertOne({
          name,
          description,
        });
        console.log(result);

        res.status(201).json({
          success: true,
          message: "Comment added successfully",
        });
      } catch (error) {
        console.error("Error adding Comment:", error);
        res.status(500).json({
          success: false,
          message: "Error adding Comment",
        });
      }
    });

    // Get all Comments
    app.get("/api/v1/comments", async (req, res) => {
      try {
        const comments = await commentCollection.find({}).toArray();
        res.json({
          success: true,
          data: comments,
        });
      } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching comments",
        });
      }
    });

    // Get a single comment
    app.get("/api/v1/comments/:id", async (req, res) => {
      const commentId = req.params.id;

      try {
        const comment = await commentCollection.findOne({
          _id: new ObjectId(commentId),
        });

        if (comment) {
          res.json({
            success: true,
            data: comment,
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Comment not found",
          });
        }
      } catch (error) {
        console.error("Error fetching Comment:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching Comment",
        });
      }
    });

    // Comment Update Operation
    app.put("/api/v1/comments/:id", async (req, res) => {
      const commentId = req.params.id;
      const { description } = req.body;

      try {
        const filter = { _id: new ObjectId(commentId) };
        const updateDoc = {
          description,
        };

        const result = await commentCollection.replaceOne(filter, updateDoc, {
          new: true,
        });

        if (result.modifiedCount === 1) {
          res.json({
            success: true,
            message: "Comment updated successfully",
          });
        } else {
          res.status(404).json({
            success: false,
            message: "Comment not found",
          });
        }
      } catch (error) {
        console.error("Error updating Comment:", error);
        res.status(500).json({
          success: false,
          message: "Error updating Comment",
        });
      }
    });

    // Delete Comment
    app.delete("/api/v1/comments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await commentCollection.deleteOne(query, {
        new: true,
      });
      res.send(result);
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
