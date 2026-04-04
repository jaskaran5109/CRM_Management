import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import statusRoutes from './routes/status.js';
import userRoleRoutes from './routes/userRole.js';
import roleStatusRoutes from './routes/roleStatus.js';
import stateCitiesRoute from "./routes/stateCities.js";
import cxModelRoutes from "./routes/cxModel.js";
import cxServiceCategoryRoutes from "./routes/cxServiceCategory.js";
import cxDataRoutes from "./routes/cxData.js";
import dashboardRoutes from "./routes/dashboard.js";
import complaintsRoutes from "./routes/complaints.js";
import publicComplaintsRoutes from "./routes/publicComplaints.js";

const app = express();

// CORS Configuration for all environments
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean); // Remove undefined values

app.use(helmet());
app.use(cors({ 
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Sanitize request objects against query selector injection without overwriting readonly getters (Express 5)
app.use((req, res, next) => {
  const sanitizeTarget = (target) => {
    if (target && typeof target === "object") {
      mongoSanitize.sanitize(target);
    }
  };

  sanitizeTarget(req.body);
  sanitizeTarget(req.params);
  sanitizeTarget(req.headers);
  sanitizeTarget(req.query);

  const escapeString = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");

  const xssClean = (object) => {
    if (object && typeof object === "object") {
      Object.keys(object).forEach((key) => {
        if (typeof object[key] === "string") {
          object[key] = escapeString(object[key]);
        } else if (typeof object[key] === "object" && object[key] !== null) {
          xssClean(object[key]);
        }
      });
    }
  };

  xssClean(req.body);
  xssClean(req.params);
  xssClean(req.query);

  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/public/complaints', publicComplaintsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/role-statuses', roleStatusRoutes);
app.use("/api/state-cities", stateCitiesRoute);
app.use("/api/cx-models", cxModelRoutes);
app.use("/api/cx-service-categories", cxServiceCategoryRoutes);
app.use("/api/cx-data", cxDataRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.get('/', (req, res) => res.json({ message: 'MERN Auth API running' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error('MongoDB error:', err));