import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreatePropertyModalProps {
    createProperty: (e: React.FormEvent) => Promise<void>;
    form: {
        propertyName: string;
        totalTokens: number;
        pricePerToken: number;
        tokenSymbol: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CreatePropertyModal({ createProperty, form, handleChange }: CreatePropertyModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Create New Property</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Property</DialogTitle>
                </DialogHeader>
                <form onSubmit={createProperty} className="space-y-4">
                    <div>
                        <Label htmlFor="propertyName">Property Name</Label>
                        <Input
                            id="propertyName"
                            name="propertyName"
                            value={form.propertyName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="totalTokens">Total Tokens</Label>
                        <Input
                            id="totalTokens"
                            name="totalTokens"
                            type="number"
                            value={form.totalTokens}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="pricePerToken">Price per Token (USDC)</Label>
                        <Input
                            id="pricePerToken"
                            name="pricePerToken"
                            type="number"
                            value={form.pricePerToken}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="tokenSymbol">Token Symbol</Label>
                        <Input
                            id="tokenSymbol"
                            name="tokenSymbol"
                            value={form.tokenSymbol}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <Button type="submit">Create Property</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}