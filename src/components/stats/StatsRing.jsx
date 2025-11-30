export default function StatsRing({ label, value, color }) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20">
          {/* Outer track */}
          <div
            className="
              absolute inset-0 rounded-full 
              border-4 border-neutral-700
            "
          />
  
          {/* Progress overlay */}
          <svg className="w-full h-full rotate-[-90deg]">
            <circle
              cx="40"
              cy="40"
              r="32"
              strokeWidth="6"
              stroke={color}
              strokeDasharray="200"
              strokeDashoffset={200 - (200 * value) / 100}
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
        </div>
  
        <p className="text-sm text-gray-300">{label}</p>
      </div>
    );
  }
  