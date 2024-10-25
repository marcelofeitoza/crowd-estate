import http from "http";
import dotenv from "dotenv";
import {
	handleJsonRpcRequest,
	handleRestRequest,
} from "./controllers/rpcController";

dotenv.config();

const server = http.createServer(async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Origin",
		"https://crowd-estate.vercel.app"
	);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization"
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.method === "GET" && req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "OK" }));
		return;
	}

	if (req.method === "POST" && req.url === "/json-rpc") {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString();
		});
		req.on("end", async () => {
			try {
				const response = await handleJsonRpcRequest(body);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(response));
			} catch (error: any) {
				const response = {
					jsonrpc: "2.0",
					error: {
						code: error.code || -32603,
						message: error.message || "Internal error",
					},
					id: null,
				};
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify(response));
			}
		});
	} else if (
		req.method === "POST" ||
		(req.method === "GET" &&
			(req.url === "/login" ||
				req.url === "/register" ||
				req.url === "/create-property"))
	) {
		await handleRestRequest(req, res);
	} else {
		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "Not Found" }));
	}
});

const PORT: number = parseInt(process.env.PORT || "5500");
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
