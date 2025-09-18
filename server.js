const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config();

const userRoutes = require("./routes/users");
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

// Use in-memory MongoDB instead of real Mongo
(async () => {
  try {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri);
    console.log("✅ Connected to In-Memory MongoDB");

    app.listen(process.env.PORT || 5000, () =>
      console.log(`✅ Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect:", err);
  }
})();
