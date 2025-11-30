import Card from "../../components/ui/Card";

export default function Feed() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Explore</h1>

      <Card className="mb-4">
        <div className="h-36 bg-neutral-800 rounded-md" />
        <h3 className="mt-3 font-semibold">Recovery Nutrition: What Works Best</h3>
        <p className="text-slate-400 text-sm">AI Summary · 4 mins</p>
      </Card>

      <Card>
        <div className="h-36 bg-neutral-800 rounded-md" />
        <h3 className="mt-3 font-semibold">Progressive Overload Explained</h3>
        <p className="text-slate-400 text-sm">Fitness · 6 mins</p>
      </Card>
    </div>
  );
}
