import StatsRing from "../../components/stats/StatsRing";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function Home() {
  return (
    <div className="px-5 py-6 max-w-2xl mx-auto space-y-6">

      {/* Greeting Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, Hassan 👋</h1>
          <p className="text-gray-400 text-sm">Here’s your progress for today</p>
        </div>

        <div className="w-12 h-12 rounded-full bg-neutral-700" />
      </div>

      {/* Activity Rings */}
      <div className="flex items-center justify-between px-1">
        <StatsRing label="Move" value={68} color="#ef4444" />
        <StatsRing label="Exercise" value={45} color="#22c55e" />
        <StatsRing label="Stand" value={80} color="#3b82f6" />
      </div>

      {/* Today's Workout Card */}
      <Card className="p-5 bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-700 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Today’s Workout</p>
            <h2 className="mt-1 text-lg font-semibold">Upper Body Power</h2>
          </div>

          <Button className="bg-primary-500 text-white hover:bg-primary-600">
            Start
          </Button>
        </div>
      </Card>

      {/* AI Insights Card */}
      <Card className="p-5 bg-neutral-900 border-neutral-700">
        <h3 className="text-base font-semibold mb-2 text-primary-500">
          FitAI Insights
        </h3>
        <p className="text-gray-400 text-sm">
          You’re 12% closer to your weekly goal. Consider a 20-minute stretching
          session today for improved recovery.
        </p>
      </Card>

      {/* Weekly Progress Placeholder */}
      <Card className="p-5 border-neutral-700">
        <p className="text-sm text-gray-300 mb-3">Weekly Progress</p>

        <div className="flex items-end gap-2 h-24">
          <div className="w-6 rounded bg-primary-700 h-[30%]" />
          <div className="w-6 rounded bg-primary-700 h-[40%]" />
          <div className="w-6 rounded bg-primary-700 h-[60%]" />
          <div className="w-6 rounded bg-primary-700 h-[45%]" />
          <div className="w-6 rounded bg-primary-700 h-[70%]" />
          <div className="w-6 rounded bg-primary-700 h-[55%]" />
          <div className="w-6 rounded bg-primary-700 h-[85%]" />
        </div>
      </Card>
    </div>
  );
}
