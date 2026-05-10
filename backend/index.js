const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

const dbUri = process.env.DB_URI || "mongodb://127.0.0.1:27017/hometownhub";
const fallbackDbUri = "mongodb://127.0.0.1:27017/hometownhub";
let mongoServer;

const connectToDb = async (uri) => {
  console.log(`Attempting database connection to ${uri}`);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log(`DB Connected to ${uri}`);
};

const startInMemoryMongo = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log("Started in-memory MongoDB server");
  await connectToDb(uri);
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connection event: connected", mongoose.connection.readyState);
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection event: error", err.message, mongoose.connection.readyState);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection event: disconnected", mongoose.connection.readyState);
});

const tryConnect = async () => {
  try {
    await connectToDb(dbUri);
  } catch (err) {
    console.error("Primary DB connect failed:", err.message);

    if (dbUri !== fallbackDbUri) {
      console.log("Attempting fallback local MongoDB connection...");
      try {
        await connectToDb(fallbackDbUri);
      } catch (localErr) {
        console.error("Fallback local DB connect failed:", localErr.message);
      }
    }

    if (mongoose.connection.readyState !== 1) {
      console.log("Attempting in-memory MongoDB fallback...");
      try {
        await startInMemoryMongo();
      } catch (memoryErr) {
        console.error("In-memory DB connect failed:", memoryErr.message);
      }
    }
  }
};

// routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const communityRoutes = require("./routes/communityRoutes");
const eventRoutes = require("./routes/eventRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/events", eventRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await tryConnect();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();