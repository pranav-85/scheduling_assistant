import express from "express";
import bodyParser from "body-parser";
import appointmentRoutes from "./routes/appointment.js";
import testRoutes from "./routes/test.js";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(bodyParser.json());

app.use("/appointment", appointmentRoutes);
app.use("/test", testRoutes);


app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});