console.log('Testing dependencies...');

try {
  console.log('1. Testing express...');
  const express = require('express');
  console.log('✅ Express OK');

  console.log('2. Testing cors...');
  const cors = require('cors');
  console.log('✅ CORS OK');

  console.log('3. Testing helmet...');
  const helmet = require('helmet');
  console.log('✅ Helmet OK');

  console.log('4. Testing morgan...');
  const morgan = require('morgan');
  console.log('✅ Morgan OK');

  console.log('5. Testing socket.io...');
  const socketIo = require('socket.io');
  console.log('✅ Socket.IO OK');

  console.log('6. Testing mongoose...');
  const mongoose = require('mongoose');
  console.log('✅ Mongoose OK');

  console.log('All dependencies loaded successfully!');
} catch (error) {
  console.error('❌ Dependency error:', error.message);
}
