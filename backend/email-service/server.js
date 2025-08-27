const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const emailRoutes = require("./routes/emailRoutes");
app.use("/api/email", emailRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`📬 email-service en cours sur http://localhost:${PORT}`);
});
