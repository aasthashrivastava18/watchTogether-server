console.log('Starting minimal server...');

const express = require('express');
console.log('Express loaded successfully');

const app = express();
console.log('Express app created');

app.get('/', (req, res) => {
  res.send('Hello World');
});

console.log('Route defined');

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});
