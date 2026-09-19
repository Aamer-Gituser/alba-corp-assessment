/**
 * The route-level skeleton is an undeveloped plate, matching the image
 * component's own loading state so a navigation reads as one continuous
 * exposure rather than two different waiting animations.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-5 py-8 sm:px-8 sm:py-12">
      <div className="h-6 w-32 bg-plate-slate" />
      <div className="mt-10 h-4 w-48 bg-plate-slate" />
      <div className="mt-4 h-12 w-3/4 max-w-2xl bg-plate-slate" />
      <div className="relative mt-6 aspect-4/3 w-full overflow-hidden border border-plate-edge bg-plate-slate sm:aspect-16/9">
        <div className="animate-sweep absolute inset-y-0 -inset-x-1/4 bg-gradient-to-r from-transparent via-plate-edge to-transparent" />
      </div>
      <span className="sr-only">Retrieving the plate for this date</span>
    </div>
  );
}
