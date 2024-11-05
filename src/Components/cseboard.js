import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cseboard.css";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

function CseBoard() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uiLog, setUiLog] = useState([]);

  const dropdownData = [
    {
  label: "Org",
  options: [
    "AF Group",
    "BHS",
    "DHL",
    "Diameter Services",
    "Edentree",
    "Exelixis",
    "Ernst & Young",
    "Granite Construction",
    "JATO Dynamics",
    "Juniper Networks",
    "J&J",
    "J&J CDL",
    "J&J Pharma Pod",
    "J&J IBM",
    "J&J TBD",
    "Kenvue",
    "Kindercare",
    "Medidata",
    "Mercy",
    "NICO",
    "oneZero",
    "OPM",
    "P&G",
    "Patterson",
    "RPMI Railpen",
    "ServiceNow",
    "Ucare",
    "Wolters Kluwer",
    "Walmart",
    "Edentree-DF",
    "Mingledorffs",
    "Pace Claims",
    "JnJ-DM",
    "NICO-DM",
    "Phoenix Publishing",
    "Foundation Home Loans",
    "General Electric (GAS POWER)",
    "IQVIA / DMD"
  ],
    },
    {
      label: "CSE_Owner",
      options: ["Abhi", "Anil", "Nuthan",'None'],
    },
    {
      label: "Build_Version",
      options: ["-", "2024.03", "2024.06", "2024.09"],
    },
    { label: "Reason", options: [] },
    { label: "Remedy", options: [] },
    { label: "Upsell/Cross sell Opportunity", options: [] },
    { label: "Churn_Risk", options: ["Yes", "No"] },
    { label: "ARR", options: [] },
    { label: "Health", options: ["-", "Green", "Red", "Yellow"] },
  ];

  const handleChange = (label, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [label]: value,
    }));
    setError("");
  };

  const handleFocus = (label) => {
    if (!formData[label]) {
      setFormData({ ...formData, [label]: "-" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(
        ([key, value]) => value && value !== "-"
      )
    );

    if (!filteredData.Org || Object.keys(filteredData).length < 2) {
      setError("Org and at least one additional field must be filled.");
      return;
    }

    setUiLog((prevLog) => [...prevLog, `Attempting to update Org: ${filteredData.Org}`]);

    try {
      const response = await fetch("http://localhost:3006/api/saveData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filteredData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update Org information.");
      }

      setSuccess(result.message || "Org information updated successfully.");
      setUiLog((prevLog) => [...prevLog, "Update successful"]);
      
      // Clear form data and messages
      setFormData({});
      setTimeout(() => {
        setSuccess("");
      }, 3000);  // Success message disappears after 3 seconds

    } catch (error) {
      setError("An error occurred while updating Org information. Please try again.");
      setUiLog((prevLog) => [...prevLog, `Update failed: ${error.message}`]);
    }
  };

  return (
    <div className="container">
      <h1>CSE DB Update Board</h1>
      <div className="dropdown-box">
        <form onSubmit={handleSubmit}>
          {dropdownData.map((dropdown, index) => (
            <div className="form-group row" key={index}>
              <label htmlFor={`input${index}`} className="col-sm-3 col-form-label">
                {dropdown.label}
              </label>
              <div className="col-sm-9 position-relative">
                {dropdown.options.length > 0 ? (
                  <select
                    className="form-control"
                    id={`input${index}`}
                    value={formData[dropdown.label] || "-"}
                    onChange={(e) => handleChange(dropdown.label, e.target.value)}
                    onFocus={() => handleFocus(dropdown.label)}
                  >
                    <option value="-">Select an option</option>
                    {dropdown.options.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    id={`input${index}`}
                    placeholder={`Enter ${dropdown.label}`}
                    value={formData[dropdown.label] || ""}
                    onChange={(e) => handleChange(dropdown.label, e.target.value)}
                  />
                )}
                {dropdown.options.length > 0 && <span className="dropdown-arrow">&#9660;</span>}
              </div>
            </div>
          ))}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Button variant="primary" type="submit">
            Update
          </Button>
        </form>

        <div className="ui-log">
          {/* <h2>UI Log:</h2>
          <ul>
            {uiLog.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul> */}
        </div>
      </div>
    </div>
  );
}

export default CseBoard;
