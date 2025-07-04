const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin with emulator support
if (!admin.apps.length) {
  // Check if we're running in emulator environment
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" || 
                    process.env.NODE_ENV === "development";
  
  const config = {
    projectId: process.env.GCLOUD_PROJECT || "demo-unionspace-crm"
  };

  if (isEmulator) {
    console.log('🚀 Firebase Functions running in EMULATOR mode');
    
    // For emulator, don't need service account credentials
    // The emulator will handle authentication automatically
    config.storageBucket = `${config.projectId}.appspot.com`;
    
    // Set emulator host for storage (this helps the admin SDK connect to emulator)
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      console.log(`📦 Storage Emulator Host: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
    } else {
      const storagePort = 9999; // Should match firebase.json
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = `127.0.0.1:${storagePort}`;
      console.log(`📦 Fallback: Set Storage Emulator Host to 127.0.0.1:${storagePort}`);
    }
  } else {
    console.log('🌐 Firebase Functions running in PRODUCTION mode');
    // Production config will use default service account from environment
  }

  admin.initializeApp(config);
}

// Set global options
setGlobalOptions({
  region: "asia-southeast1", // Singapore region for better latency in Indonesia
  memory: "512MiB",
  timeoutSeconds: 60,
});

// Import all function modules
const citiesFunctions = require("./src/cities");
const servicesFunctions = require("./src/services");
const spacesFunctions = require("./src/spaces");
const buildingsFunctions = require("./src/buildings");
const ordersFunctions = require("./src/orders");
const dashboardFunctions = require("./src/dashboard");
const databaseFunctions = require("./src/database");
const amenitiesFunctions = require("./src/amenities");
const customersFunctions = require("./src/customers");

// Export all functions
exports.cities = citiesFunctions.cities;
exports.services = servicesFunctions.services;
exports.spaces = spacesFunctions.spaces;
exports.buildings = buildingsFunctions.buildings;
exports.orders = ordersFunctions.orders;
exports.dashboard = dashboardFunctions.dashboard;
exports.database = databaseFunctions.database;
exports.amenities = amenitiesFunctions.amenities;
exports.customers = customersFunctions.customers;

// Health check endpoint
exports.health = onRequest((req, res) => {
  cors(req, res, () => {
    res.json({
      status: "ok",
      message: "UnionSpace CRM API is running",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      environment: process.env.FUNCTIONS_EMULATOR === "true" ? "emulator" : "production"
    });
  });
});

// Scheduled function to update spaces operational status every 5 minutes
exports.updateSpacesOperationalStatus = onSchedule({
  schedule: "*/5 * * * *", // Every 5 minutes
  timeZone: "Asia/Jakarta",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  console.log('🕐 Scheduled update of spaces operational status started');
  
  try {
    // Import the function here to avoid circular imports
    const { updateAllSpacesOperationalStatus } = require("./src/spacesOperationalStatusUpdater");
    
    const updatedCount = await updateAllSpacesOperationalStatus();
    console.log(`✅ Scheduled update completed: ${updatedCount} spaces updated`);
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('❌ Scheduled update failed:', error);
    throw error;
  }
});

// Scheduled function to update order statuses based on dates every 15 minutes
exports.updateOrderStatuses = onSchedule({
  schedule: "*/15 * * * *", // Every 15 minutes
  timeZone: "Asia/Jakarta",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  console.log('🕐 Scheduled update of order statuses started');
  
  try {
    // Import the function from orders.js
    const { updateOrderStatuses } = require("./src/orders");
    
    const updatedCount = await updateOrderStatuses();
    console.log(`✅ Scheduled order status update completed: ${updatedCount.active} orders set to active, ${updatedCount.completed} orders completed`);
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('❌ Scheduled order status update failed:', error);
    throw error;
  }
});

// Scheduled function to fix spaces booking status daily
exports.fixSpacesBookingStatus = onSchedule({
  schedule: "0 0 * * *", // Every day at midnight
  timeZone: "Asia/Jakarta",
  memory: "256MiB",
  timeoutSeconds: 300
}, async (event) => {
  console.log('🕐 Scheduled fix of spaces booking status started');
  
  try {
    // Import the function from orders.js
    const { fixSpacesBookingStatus } = require("./src/orders");
    
    const result = await fixSpacesBookingStatus();
    console.log(`✅ Scheduled spaces booking status fix completed: ${result.fixed} spaces fixed`);
    
    return { success: true, fixed: result.fixed };
  } catch (error) {
    console.error('❌ Scheduled spaces booking status fix failed:', error);
    throw error;
  }
}); 