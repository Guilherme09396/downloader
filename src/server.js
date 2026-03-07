const express = require("express");
const cors = require("cors");

const downloadRoute = require("./routes/download");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", downloadRoute);

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});