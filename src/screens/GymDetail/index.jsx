import { useParams } from "react-router-dom";

export default function GymDetail() {
  const { gymId } = useParams();

  return (
    <div className="pb-28">
      {/* Hero */}
      <div className="h-56 bg-gradient-to-b from-neutral-800 to-black rounded-b-3xl" />

      <div className="px-4 space-y-6 -mt-12">
        {/* Header */}
        <div className="rounded-2xl bg-neutral-900 p-4 space-y-2">
          <h1 className="text-xl font-semibold">Iron Works Gym</h1>
          <p className="text-sm text-neutral-400">
            Anna Nagar · Strength Training
          </p>

          <div className="flex gap-2 pt-2 flex-wrap">
            <Tag label="Premium" />
            <Tag label="24x7" />
            <Tag label="Sauna" />
            <Tag label="Trainers" />
          </div>
        </div>

        {/* About */}
        <section className="space-y-2">
          <h2 className="text-lg font-medium">About</h2>
          <p className="text-sm text-neutrl-400 leading-relaxed">
            Iron Works Gym is a premium strength-focused gym with top-tier
            equipment, experienced trainers, and recovery facilities.
          </p>
        </section>

        {/* Trainers */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Trainers</h2>

          <div className="flex gap-3 overflow-x-auto">
            <TrainerCard />
            <TrainerCard />
            <TrainerCard />
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4">
        <button className="w-full rounded-2xl bg-white text-black py-4 font-medium">
          Enquire Membership
        </button>
      </div>
    </div>
  );
}

function Tag({ label }) {
  return (
    <div className="px-3 py-1 rounded-full bg-neutral-800 text-xs text-neutral-300">
      {label}
    </div>
  );
}

function TrainerCard() {
  return (
    <div className="min-w-[140px] rounded-xl bg-neutral-900 p-3 space-y-2">
      <div className="h-20 rounded-lg bg-neutral-800" />
      <div>
        <p className="text-sm font-medium">Trainer Name</p>
        <p className="text-xs text-neutral-400">Strength Coach</p>
      </div>
    </div>
  );
}
