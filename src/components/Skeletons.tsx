export function RowSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5 px-4 pt-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 p-3.5">
          <div className="skeleton h-12 w-12 rounded-[13px]" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/5" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeckSkeleton() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <div className="card relative flex-1 overflow-hidden">
        <div className="skeleton h-44 w-full rounded-none" />
        <div className="space-y-3 p-5">
          <div className="flex gap-2">
            <div className="skeleton h-6 w-28 rounded-full" />
            <div className="skeleton h-6 w-32 rounded-full" />
          </div>
          <div className="skeleton h-3 w-1/4" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-5/6" />
          <div className="skeleton h-3 w-1/4 !mt-5" />
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-2/3" />
        </div>
      </div>
      <div className="flex justify-center gap-5 pt-4">
        <div className="skeleton h-14 w-14 rounded-full" />
        <div className="skeleton h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 px-5 pt-2">
      <div className="flex items-center gap-4">
        <div className="skeleton h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
      <div className="card space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-2.5 w-1/5" />
            <div className="skeleton h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
