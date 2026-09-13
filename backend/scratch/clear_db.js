const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Billboard = require('../models/Billboard');

async function clearBillboards() {
  try {
    // If no URI, it might be using the memory server, but we can't easily connect to it from a separate script.
    // However, if the user is running the app, we can just add a temporary route to clear it.
    console.log('To clear billboards, I will add a temporary route to the server.');
  } catch (err) {
    console.error(err);
  }
}

clearBillboards();
