import express from "express";
import { handleLogin } from "../controllers/user/login";
import { handleRegister } from "../controllers/user/register";

const router = express.Router();

router.post("/login", async (req, res, next) => {
	try {
		const response = await handleLogin(req.body);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/register", async (req, res, next) => {
	try {
		const response = await handleRegister(req.body);
		res.status(201).json(response);
	} catch (error) {
		next(error);
	}
});

export default router;
