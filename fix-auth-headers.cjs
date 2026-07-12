const fs = require('fs');
const path = require('path');

const storeFile = path.join(__dirname, 'src', 'lib', 'transitops-store.tsx');
let storeContent = fs.readFileSync(storeFile, 'utf8');

// Replace standard fetch with auth headers
// First, create a getAuthHeaders helper inside TransitOpsProvider
storeContent = storeContent.replace(
  `  const refreshData = async () => {`,
  `  const getAuthHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (state.session?.token) {
      headers["Authorization"] = \`Bearer \${state.session.token}\`;
    }
    return headers;
  };

  const refreshData = async () => {`
);

// Replace fetch in refreshData
storeContent = storeContent.replace(
  `        fetch(\`\${API_BASE}/vehicles\`),
        fetch(\`\${API_BASE}/drivers\`),
        fetch(\`\${API_BASE}/trips\`),
        fetch(\`\${API_BASE}/maintenance\`),
        fetch(\`\${API_BASE}/expenses\`),
        fetch(\`\${API_BASE}/analytics/dashboard\`),`,
  `        fetch(\`\${API_BASE}/vehicles\`, { headers: getAuthHeaders() }),
        fetch(\`\${API_BASE}/drivers\`, { headers: getAuthHeaders() }),
        fetch(\`\${API_BASE}/trips\`, { headers: getAuthHeaders() }),
        fetch(\`\${API_BASE}/maintenance\`, { headers: getAuthHeaders() }),
        fetch(\`\${API_BASE}/expenses\`, { headers: getAuthHeaders() }),
        fetch(\`\${API_BASE}/analytics/dashboard\`, { headers: getAuthHeaders() }),`
);

// Replace addVehicle
storeContent = storeContent.replace(
  `          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),`,
  `          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(v),`
);

// Replace updateVehicle
storeContent = storeContent.replace(
  `          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),`,
  `          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(patch),`
);

// Replace addDriver
storeContent = storeContent.replace(
  `          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),`,
  `          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(d),`
);

// Replace addTrip
storeContent = storeContent.replace(
  `          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),`,
  `          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(t),`
);

// Replace updateTripStatus
storeContent = storeContent.replace(
  `          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),`,
  `          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),`
);

// Replace addMaintenance
storeContent = storeContent.replace(
  `          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(m),`,
  `          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(m),`
);

// Replace toggleMaintenance
storeContent = storeContent.replace(
  `          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),`,
  `          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),`
);

// Replace addExpense
storeContent = storeContent.replace(
  `          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),`,
  `          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(e),`
);

fs.writeFileSync(storeFile, storeContent);

// Fix settings.tsx trigger cron fetch
const settingsFile = path.join(__dirname, 'src', 'routes', '_authenticated.settings.tsx');
let settingsContent = fs.readFileSync(settingsFile, 'utf8');

settingsContent = settingsContent.replace(
  `const res = await fetch("http://localhost:5000/api/analytics/trigger-cron", { method: "POST" });`,
  `const res = await fetch("http://localhost:5000/api/analytics/trigger-cron", { 
                  method: "POST",
                  headers: {
                    "Authorization": \`Bearer \${useStore.getState().session?.token}\`
                  }
                });`
);

fs.writeFileSync(settingsFile, settingsContent);
console.log("Updated API calls to include auth headers.");
