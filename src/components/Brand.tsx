import Link from "next/link";

export function Brand({ suffix }: { suffix?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-bold text-white">S</span>
      <span className="text-lg font-semibold tracking-tight">
        StudyMate
        {suffix && <span className="ml-1.5 font-normal text-muted">{suffix}</span>}
      </span>
    </Link>
  );
}
