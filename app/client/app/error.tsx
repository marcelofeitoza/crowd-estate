"use client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100">
			<Card className="max-w-md w-full">
				<CardHeader>
					<CardTitle className="text-center">
						404 - Page Not Found
					</CardTitle>
				</CardHeader>
			</Card>
		</div>
	);
}
