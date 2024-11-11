import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./cseboard.css";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

function CseBoard() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uiLog, setUiLog] = useState([]);
  const [orgOptions, setOrgOptions] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  const dropdownData = [
    { label: "CSE_Owner", options: ["Abhi", "Anil", "Nuthan", "None"] },
    { label: "Build_Version", options: ["-", "2024.03", "2024.06", "2024.09"] },
    { label: "Reason", options: [] },
    { label: "Remedy", options: [] },
    { label: "Upsell/Cross sell Opportunity", options: [] },
    { label: "Churn_Risk", options: ["Yes", "No"] },
    { label: "ARR", options: [] },
    { label: "Health", options: ["-", "Green", "Red", "Yellow"] },
  ];

  useEffect(() => {
    const fetchOrgOptions = async () => {
      try {
        const response = await fetch("http://localhost:3006/api/Org");
        if (!response.ok) {
          throw new Error("Failed to fetch Org options");
        }
        const data = await response.json();
        setOrgOptions(data);
      } catch (error) {
        console.error("Error fetching Org options:", error);
      }
    };

    fetchOrgOptions();
  }, []);

  const fetchCustomerData = async (org) => {
    try {
      const response = await fetch(`http://localhost:3006/api/customer/${org}`);
      if (!response.ok) {
        throw new Error("Failed to fetch customer data");
      }
      const data = await response.json();
      setFormData(data);  // Populate the form fields with fetched data
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  };

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

  const handleOrgChange = (value) => {
    setSelectedOrg(value);
    handleChange("Org", value);
    fetchCustomerData(value); // Fetch customer data when Org is selected
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => value && value !== "-")
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
      
      setFormData({});
      setTimeout(() => setSuccess(""), 3000);

    } catch (error) {
      setError("An error occurred while updating Org information. Please try again.");
      setUiLog((prevLog) => [...prevLog, `Update failed: ${error.message}`]);
    }
  };

  return (
    <div className="fullcover">
      <h1>Customer Information Update Form</h1>
      <div className="container">
        <div className="dropdown-box">
          <form onSubmit={handleSubmit}>
            {/* Org Dropdown with fetched options */}
            <div className="form-group row">
              <label htmlFor="orgDropdown" className="col-sm-3 col-form-label">
                Org
              </label>
              <div className="col-sm-9 position-relative">
                <select
                  className="form-control"
                  id="orgDropdown"
                  value={selectedOrg || "-"}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  onFocus={() => handleFocus("Org")}
                >
                  <option value="-">Select an option</option>
                  {orgOptions.length > 0 ? (
                    orgOptions.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))
                  ) : (
                    <option value="-">No options available</option>
                  )}
                </select>
                <span className="dropdown-arrow">&#9660;</span>
              </div>
            </div>

            {/* Other dropdowns */}
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
            <h2>UI Log:</h2>
            <ul>
              {uiLog.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CseBoard;
