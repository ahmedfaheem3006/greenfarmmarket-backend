import app from './app';

// Hostinger controls process.env.PORT dynamically. Fallback to 3000 for Hostinger compatibility.
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌱 Green Farm Market Backend API Service`);
  console.log(`🚀 Server listening on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
