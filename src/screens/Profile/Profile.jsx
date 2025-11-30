import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function Profile() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-neutral-700" />
        <div>
          <h2 className="text-lg font-bold">Hassan</h2>
          <p className="text-slate-400">Premium Member</p>
        </div>
      </div>

      <Card className="mb-4">
        <h3 className="font-semibold">Memberships</h3>
        <p className="text-slate-400">Active memberships and payment methods</p>
      </Card>

      <Button>Get AI Recommendations</Button>
    </div>
  );
}
