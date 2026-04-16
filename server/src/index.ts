import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";

import {isAuthenticated} from "./middlewares/auth-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express, {NextFunction, type Request, type Response} from "express";
import http from "http";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {sequelize} from "./db/db";
import { verifyCallback } from "./components/helpers/auth-helper";
import { expressSessionConfig} from "./middlewares/auth-middleware";

//controllers
import {passportController} from "./controllers/passport-controller";
import { authController } from "./controllers/auth-controller";

const app = express()
const port = 3000
const pgSession = connectPgSimple(expressSession);

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
}

passport.use(new GoogleStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: "/auth/google/callback"
}, verifyCallback));


// Save session from cookie
passport.serializeUser((user, done) => {
    done(null, user);
    //TODO store just id
})


// Read session from cookie
passport.deserializeUser((obj: Express.User, done) => {
    done(null, obj);
})

app.use(express.json());

//TODO add helmet for security hardening
app.use(expressSessionConfig(pgSession))
app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World XXX!')
})

app.get("/api/me", isAuthenticated, (req: Request, res: Response) => {
    res.json({ user: req.user });
});

//authentification routes
app.get("/auth/google", passportController.googlAuth);

app.get("/auth/google/callback", passportController.googleAuthCallback);

app.get("/auth/failure", authController.failure);

app.get("/auth/logout", authController.logOut);

// after app setup, before app.listen:
await sequelize.authenticate();  // verifies connection
await sequelize.sync({ alter: true });

const httpServer = http.createServer(app)

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

export default httpServer
