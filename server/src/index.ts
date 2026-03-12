import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express, {type Request, type Response} from "express";
import http from "http";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import enviroment from "../config/enviroment-variables.json" with { type: "json" };

const app = express()
const port = 3000

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
}

function verifyCallback(accessToken: string, refreshToken: string, profile: any, done: any) {
  // Here you would typically find or create a user in your database
  // For this example, we'll just return the profile
  console.log("Profile:", profile);
  return done(null, profile);
}

passport.use(new GoogleStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: "/auth/google/callback"
}, verifyCallback));

app.use(express.json());

//TODO add helmet for security hardening
app.use(passport.initialize());


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World XXX!')
})

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google", {
    successRedirect: `${enviroment.frontend.baseUrl}/dummy-home`,
    failureRedirect: "/auth/failure",
    session: false
}), (req: Request, res: Response) => {
    // This callback will be called after successful authentication
    console.log("Authentication successful, user:", req?.user);
});

app.get("/auth/failure", (req: Request, res: Response) => {
    //TODO: handle failure case properly, maybe redirect to a custom error page on the frontend
    res.send("Authentication failed")
});

app.get("/auth/logout", (req: Request, res: Response) => {});

const httpServer = http.createServer(app)

httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

export default httpServer
