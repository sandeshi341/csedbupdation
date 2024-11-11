const express = require("express");
const sql = require("mssql");
const bodyParser = require("body-parser");
const cors = require("cors");
const winston = require("winston");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3006;

// Middleware to parse JSON requests and enable CORS
app.use(bodyParser.json());
app.use(cors());

// MSSQL configuration
const dbConfig = {
  user: "RDT_ADMIN",
  password: "R1ghtD@T@Admin@Re@d",
  server: "10.10.20.193",
  database: "Dashboard",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Get the current date and create a log filename with that date
const getLogFileName = () => {
  const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  return `csedbupdate-${currentDate}.log`;
};

// Define the log directory and ensure it exists
const logDirectory = path.join("D:", "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Configure Winston logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, getLogFileName()),
    }),
    new winston.transports.Console(),
  ],
});

// Function to connect to the database
async function connectToDatabase() {
  try {
    await sql.connect(dbConfig);
    logger.info("Connected to SQL Server successfully.");
  } catch (error) {
    logger.error(`Error connecting to SQL Server: ${error.message}`);
  }
}

// Route to fetch 'Org' values for the dropdown
app.get("/api/Org", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT Org FROM Dashboard.dbo.Dashboard_With_ARR
    `);
    const Org = result.recordset.map((row) => row.Org);
    res.status(200).json(Org);
  } catch (error) {
    logger.error(`Error fetching Org data: ${error.message}`);
    res.status(500).json({ message: "Error fetching Org data", error: error.message });
  }
});

// Route to fetch customer details by Org
app.get("/api/customer/:Org", async (req, res) => {
  const { Org } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("Org", sql.VarChar, Org)
      .query(`SELECT * FROM Dashboard.dbo.Dashboard_With_ARR WHERE Org = @Org`);

    if (result.recordset.length === 0) {
      res.status(404).json({ message: "Customer not found" });
    } else {
      res.status(200).json(result.recordset[0]);
    }
  } catch (error) {
    logger.error(`Error fetching customer data: ${error.message}`);
    res.status(500).json({ message: "Error fetching customer data", error: error.message });
  }
});

// API route to save or update data
app.post("/api/saveData", async (req, res) => {
  const {
    Org,
    CSE_Owner,
    Build_Version,
    Reason,
    Remedy,
    Upsell_Cross_sell_Opportunity,
    Churn_Risk,
    // ARR,
    Health,
  } = req.body;

  if (!Org) {
    return res.status(400).json({ message: "'Org' is a required field." });
  }

  const fields = {
    CSE_Owner,
    Build_Version,
    Reason,
    Remedy,
    Upsell_Cross_sell_Opportunity,
    Churn_Risk,
    // ARR,
    Health,
  };

  const hasAtLeastOneField = Object.values(fields).some(
    (field) => field !== undefined && field !== "-" // Do not count "-" as a valid field
  );

  if (!hasAtLeastOneField) {
    return res.status(400).json({
      message: "At least one additional field must be provided for update.",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    
    // Check if the Org already exists
    const checkOrgQuery = `
      SELECT COUNT(*) AS count FROM Dashboard.dbo.Dashboard_With_ARR WHERE Org = @Org
    `;
    const checkResult = await pool
      .request()
      .input("Org", sql.VarChar, Org)
      .query(checkOrgQuery);

    const OrgExists = checkResult.recordset[0].count > 0;

    let result;
    if (OrgExists) {
      let updateQuery = `UPDATE Dashboard.dbo.Dashboard_With_ARR SET `;
      let setClauses = [];
      const request = pool.request().input("Org", sql.VarChar, Org);

      Object.keys(fields).forEach((key) => {
        if (fields[key] !== undefined && fields[key] !== "-") {
          setClauses.push(`${key} = @${key}`);
          request.input(key, sql.VarChar, fields[key]);
        }
      });

      if (setClauses.length === 0) {
        return res.status(400).json({
          message: "No valid fields to update."
        });
      }

      updateQuery += setClauses.join(", ") + " WHERE Org = @Org";
      result = await request.query(updateQuery);
      logger.info(`Org ${Org} updated successfully.`);
      res.status(200).json({ message: "Org data updated successfully" });
    } else {
      let insertQuery = `
        INSERT INTO Dashboard.dbo.Dashboard_With_ARR (Org, ${Object.keys(fields).filter((key) => fields[key] !== undefined && fields[key] !== "-").join(", ")})
        VALUES (@Org, ${Object.keys(fields).filter((key) => fields[key] !== undefined && fields[key] !== "-").map((key) => `@${key}`).join(", ")})
      `;
      const insertRequest = pool.request().input("Org", sql.VarChar, Org);

      Object.keys(fields).forEach((key) => {
        if (fields[key] !== undefined && fields[key] !== "-") {
          insertRequest.input(key, sql.VarChar, fields[key]);
        }
      });

      result = await insertRequest.query(insertQuery);
      logger.info(`New Org ${Org} inserted successfully.`);
      res.status(200).json({ message: "New Org data saved successfully" });
    }
  } catch (error) {
    logger.error(`Error saving/updating data: ${error.message}`);
    res.status(500).json({ message: "Error saving data in database", error: error.message });
  }
});

// Start the server and connect to the database
app.listen(port, async () => {
  await connectToDatabase();
  logger.info(`Server is running on http://localhost:${port}`);
});
