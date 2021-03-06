const cors = require("cors");
const express = require("express");
const apiRouter = require("./routes/api.router.js");
const {
  handleCustomErrors,
  handle500Errors,
  handlePSQLInvalidTypeErrors,
} = require("./errors.js");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.all("*", (req, res) => {
  res.status(404).send({ msg: "Invalid URL" });
});

app.use(handlePSQLInvalidTypeErrors);
app.use(handleCustomErrors);
app.use(handle500Errors);

module.exports = app;
