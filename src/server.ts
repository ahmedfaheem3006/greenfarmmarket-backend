import app from './app';

// Hostinger controls process.env.PORT dynamically. Fallback to 5000 only for local dev.
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌱 Green Farm Market Backend API Service`);
  console.log(`🚀 Server listening on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
