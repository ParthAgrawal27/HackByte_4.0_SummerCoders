import axios from 'axios';

const API_URL = 'http://localhost:3000/api/alerts';

const SCENARIOS = [
  { source: "Datadog", message: "CPU utilization > 95% on auth-service-pod-xyz." },
  { source: "PagerDuty", message: "Database connection timeout in PaymentProcessingService. 500 errors spiking." },
  { source: "NewRelic", message: "High latency detected on checkout API. P99 > 4000ms." },
  { source: "User Ticket", message: "User cannot reset password, says the email never arrives." },
  { source: "AWS CloudWatch", message: "RDS storage capacity at 98%, critical threshold reached." }
];

async function generateData() {
  console.log("Starting data generator...");
  // Pick a random scenario
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  
  // Add some random noise/variation
  const randomize = Math.random() > 0.7;
  let finalMessage = scenario.message;
  if (randomize) {
    finalMessage += ` Host: ip-10-${Math.floor(Math.random() * 255)}-${Math.floor(Math.random() * 255)}.`;
  }

  const payload = {
    source: scenario.source,
    raw_message: finalMessage
  };

  try {
    console.log(`Sending alert from [${payload.source}]...`);
    const response = await axios.post(API_URL, payload);
    console.log(`Success: Alert Processed (ID: ${response.data.data?.id})`);
  } catch (error) {
    console.error('Failed to send alert:', error.message);
  }
}

// Generate data every 15 seconds
setInterval(generateData, 15000);

// Generate one immediately
generateData();
