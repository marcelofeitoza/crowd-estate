import express from "express";
import { handleCreateProperty } from "../controllers/program/createProperty";
import { handleListProperties } from "../controllers/program/listProperties";
import { handleListInvestments } from "../controllers/program/listInvestments";
import { handleCreateInvestment } from "../controllers/program/createInvestment";
import { handleGetProperty } from "../controllers/program/getProperty";
import { handleGetInvestment } from "../controllers/program/getInvestment";
import { handleCloseProperty } from "../controllers/program/closeProperty";
import { handleDistributeDividends } from "../controllers/program/distributeDividends";
import { handleWithdrawInvestment } from "../controllers/program/withdrawInvestment";

const router = express.Router();

router.post("/create-property", async (req, res, next) => {
	try {
		const response = await handleCreateProperty(req.body);
		res.status(201).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/properties", async (req, res, next) => {
	try {
		const response = await handleListProperties(req.body);
		res.status(200).json(response);
	} catch (error: any) {
		next(error);
	}
});

router.get("/properties/:propertyPda", async (req, res, next) => {
	try {
		const response = await handleGetProperty(req.params.propertyPda);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/create-investment", async (req, res, next) => {
	try {
		const response = await handleCreateInvestment(req.body);
		res.status(201).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/investments", async (req, res, next) => {
	try {
		const response = await handleListInvestments(req.body);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.get("/investments/:investmentPda", async (req, res, next) => {
	try {
		const response = await handleGetInvestment(req.params.investmentPda);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/withdraw-investment", async (req, res, next) => {
	try {
		const response = await handleWithdrawInvestment(req.body);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/distribute-dividends", async (req, res, next) => {
	try {
		const response = await handleDistributeDividends(req.body);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

router.post("/close-property", async (req, res, next) => {
	try {
		const response = await handleCloseProperty(req.body);
		res.status(200).json(response);
	} catch (error) {
		next(error);
	}
});

export default router;
