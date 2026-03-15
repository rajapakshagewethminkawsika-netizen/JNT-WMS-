const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const suppliersRoutes = require('./routes/suppliers');
const customersRoutes = require('./routes/customers');
const locationsRoutes = require('./routes/locations');
const grnRoutes = require('./routes/grn');
const gdnRoutes = require('./routes/gdn');
const stockRoutes = require('./routes/stock');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const barcodeRoutes = require('./routes/barcode');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/gdn', gdnRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`JNT WMS API running on http://localhost:${PORT}`);
});
