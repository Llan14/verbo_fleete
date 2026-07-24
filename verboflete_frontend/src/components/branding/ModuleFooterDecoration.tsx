import Image from "next/image";

export default function ModuleFooterDecoration() {
  return (
    <div className="relative mt-8 h-24 w-full overflow-hidden rounded-2xl border border-border bg-surface md:h-28">
      <Image
        src="/inferior_pres.png"
        alt="Decoracion de cierre"
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}
