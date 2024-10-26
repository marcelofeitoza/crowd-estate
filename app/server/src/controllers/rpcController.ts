import http from "http";
import dotenv from "dotenv";
import { handleLogin } from "./user/login";
import { handleCreateProperty } from "./program/createProperty";
import { handleRegister } from "./user/register";
import { handleListProperties } from "./program/listProperties";
import { handleListInvestments } from "./program/listInvestments";

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

async function getRequestBody(req: http.IncomingMessage): Promise<any> {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString();
		});
		req.on("end", () => {
			try {
				const parsedBody = JSON.parse(body || "{}");
				resolve(parsedBody);
			} catch (error) {
				reject(error);
			}
		});
	});
}

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
			switch (pathname) {
				case "/health":
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ status: "ok" }));
					break;
				default:
					res.writeHead(404, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "Not Found" }));
					break;
			}
			break;
		case "POST":
			try {
				const requestBody = await getRequestBody(req);
				switch (pathname) {
					case "/login":
						const loginResponse = await handleLogin(requestBody);
						res.writeHead(200, {
							"Content-Type": "application/json",
						});
						res.end(JSON.stringify(loginResponse));
						break;
					case "/register":
						const registerResponse = await handleRegister(
							requestBody
						);
						res.writeHead(201, {
							"Content-Type": "application/json",
						});
						res.end(JSON.stringify(registerResponse));
						break;
					case "/create-property":
						const createPropertyResponse =
							await handleCreateProperty(requestBody);
						res.writeHead(201, {
							"Content-Type": "application/json",
						});
						res.end(JSON.stringify(createPropertyResponse));
						break;
					case "/list-properties":
						console.log("List properties");
						try {
							const requestBody = await getRequestBody(req);
							const response = await handleListProperties(
								requestBody
							);
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
						break;
					case "/list-investments":
						console.log("List investments");
						try {
							const investmentsResponse =
								await handleListInvestments(requestBody);
							res.writeHead(200, {
								"Content-Type": "application/json",
							});
							res.end(JSON.stringify(investmentsResponse));
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
						break;
					default:
						res.writeHead(404, {
							"Content-Type": "application/json",
						});
						res.end(JSON.stringify({ error: "Not Found" }));
						break;
				}
			} catch (error: any) {
				res.writeHead(error.code || 500, {
					"Content-Type": "application/json",
				});
				res.end(
					JSON.stringify({
						error: error.message || "Internal Server Error",
					})
				);
			}
			break;
		default:
			res.writeHead(405, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Method Not Allowed" }));
			break;
	}
};
