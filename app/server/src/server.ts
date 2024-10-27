import express from "express";
import cors from "cors";
import userRoutes from "./routes/user";
import programRoutes from "./routes/program";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ status: "OK" });
});

app.use("/user", userRoutes);
app.use("/program", programRoutes);

app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error("Unhandled error:", err);
		res.status(err.code || 500).json({
			error: err.message || "Internal Server Error",
		});
	}
);

const PORT: number = parseInt(process.env.PORT || "5500", 10);
app.listen(PORT, () => {
	console.log(`Server is running on port http://localhost:${PORT}/`);
});
