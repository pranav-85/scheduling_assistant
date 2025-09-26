const express = require("express");
const app = express();
require("dotenv").config();

const inputRoutes = require("./routes/inputRoutes");

app.use(express.json()); // for parsing JSON text
app.use("/api/input", inputRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
