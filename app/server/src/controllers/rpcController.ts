import http from "http";
import dotenv from "dotenv";
import { handleLogin } from "./user/login";
import { handleRegister } from "./register";
import { handleCreateProperty } from "./program/createProperty";

dotenv.config();

interface JsonRpcRequest {
	jsonrpc: string;
	method: string;
	params: any;
	id: number | string | null;
}

interface JsonRpcResponse {
	jsonrpc: string;
	result?: any;
	error?: {
		code: number;
		message: string;
	};
	id: number | string | null;
}

export const handleJsonRpcRequest = async (
	body: string
): Promise<JsonRpcResponse> => {
	const { jsonrpc, method, params, id }: JsonRpcRequest = JSON.parse(body);

	console.log("Method: ", method);
	console.log("Params: ", params);

	try {
		let result;
		switch (method) {
			default:
				throw { code: -32601, message: "Method not found" };
		}

		return {
			jsonrpc,
			result,
			id,
		};
	} catch (error: any) {
		return {
			jsonrpc,
			error: {
				code: error.code || -32603,
				message: error.message || "Internal error",
			},
			id,
		};
	}
};

export const handleRestRequest = async (
	req: http.IncomingMessage,
	res: http.ServerResponse
) => {
	if (!req.url || !req.method) {
		res.writeHead(400, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "Bad Request" }));
		return;
	}

	const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
	const pathname = parsedUrl.pathname;

	switch (req.method) {
		case "GET":
		case "/health":
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok" }));
			break;
		case "POST":
			// User
			switch (pathname) {
				case "/login":
					let loginBody = "";
					req.on("data", (chunk) => {
						loginBody += chunk.toString();
					});
					req.on("end", async () => {
						try {
							const parsedBody = JSON.parse(loginBody);
							const response = await handleLogin(parsedBody);
							res.writeHead(200, {
								"Content-Type": "application/json",
							});
							res.end(JSON.stringify(response));
						} catch (error: any) {
							res.writeHead(error.code || 500, {
								"Content-Type": "application/json",
							});
							res.end(
								JSON.stringify({
									error:
										error.message ||
										"Internal Server Error",
								})
							);
						}
					});
					break;
				case "/register":
					let registerBody = "";
					req.on("data", (chunk) => {
						registerBody += chunk.toString();
					});
					req.on("end", async () => {
						try {
							const parsedBody = JSON.parse(registerBody);
							const response = await handleRegister(parsedBody);
							res.writeHead(201, {
								"Content-Type": "application/json",
							});
							res.end(JSON.stringify(response));
						} catch (error: any) {
							res.writeHead(error.code || 500, {
								"Content-Type": "application/json",
							});
							res.end(
								JSON.stringify({
									error:
										error.message ||
										"Internal Server Error",
								})
							);
						}
					});
					break;

				// Program
				case "/create-property":
					let createPropertyBody = "";
					req.on("data", (chunk) => {
						createPropertyBody += chunk.toString();
					});
					req.on("end", async () => {
						try {
							const parsedBody = JSON.parse(createPropertyBody);
							const response = await handleCreateProperty(
								parsedBody
							);
							res.writeHead(201, {
								"Content-Type": "application/json",
							});
							res.end(JSON.stringify(response));
						} catch (error: any) {
							res.writeHead(error.code || 500, {
								"Content-Type": "application/json",
							});
							res.end(
								JSON.stringify({
									error:
										error.message ||
										"Internal Server Error",
								})
							);
						}
					});
					break;
			}
			break;
		default:
			res.writeHead(405, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Method Not Allowed" }));
			break;
	}
};
